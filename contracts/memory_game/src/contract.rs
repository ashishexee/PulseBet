#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{BcsHashable, CryptoHash};
use memory_game::{InstantiationArgument, MemoryGameAbi, Operation, OperationResponse, GameState};
use state::{Card, Game, MemoryGameState};
use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct MemoryGameContract {
    state: MemoryGameState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MemoryGameContract);

impl WithContractAbi for MemoryGameContract {
    type Abi = MemoryGameAbi;
}

impl Contract for MemoryGameContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MemoryGameState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MemoryGameContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::CreateGame { stake_amount, owner } => {
                self.execute_create_game(stake_amount, owner).await
            }
            Operation::RevealCard { card_id } => {
                self.execute_reveal_card(card_id).await
            }
            Operation::ClaimPayout => {
                self.execute_claim_payout().await
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) {}

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl MemoryGameContract {
    async fn execute_create_game(&mut self, stake_amount: u64, owner: String) -> OperationResponse {
        assert!(stake_amount > 0, "Stake amount must be positive");

        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");

        // Check no active game exists (Single Game Mode)
        let existing_game = self.state.active_game.get();
        if let Some(game) = existing_game {
             assert!(game.state != GameState::Playing, "Game already active. Finish or forfeit current game first.");
        }

        const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";
        
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        // Debit tokens (Cross-App Call)
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(stake_amount.into()),
        };
        
        self.runtime.call_application(true, token_app_id, &debit_op);

        let cards = self.generate_shuffled_cards();
        let cards_count = cards.len();

        let game = Game {
            owner: owner.clone(),
            cards,
            stake_amount,
            turn_count: 0,
            matched_cards: Vec::new(),
            first_revealed_card: None,
            state: GameState::Playing,
            payout_multiplier: None,
        };

        self.state.active_game.set(Some(game));

        OperationResponse::GameCreated {
            cards_count,
        }
    }

    async fn execute_reveal_card(&mut self, card_id: u8) -> OperationResponse {
        let mut game = self.state.active_game.get().clone().expect("No active game found");
        
        // Validation
        assert!(game.state == GameState::Playing, "Game is not playing");
        assert!(card_id < 12, "Invalid card ID");
        assert!(!game.matched_cards.contains(&card_id), "Card already matched");
        
        if let Some(first_card) = game.first_revealed_card {
             assert!(first_card != card_id, "Card already revealed");
        }

        let card_image_id = game.cards[card_id as usize].image_id;
        let mut is_match_result = None;

        match game.first_revealed_card {
            None => {
                // First card of the turn
                game.first_revealed_card = Some(card_id);
            }
            Some(prev_card_id) => {
                // Second card of the turn
                assert!(card_id != prev_card_id, "Cannot click the same card twice");

                let prev_card_image_id = game.cards[prev_card_id as usize].image_id;

                // Increment turn count
                game.turn_count += 1;

                let is_match = card_image_id == prev_card_image_id;
                is_match_result = Some(is_match);

                if is_match {
                    game.matched_cards.push(prev_card_id);
                    game.matched_cards.push(card_id);
                }

                game.first_revealed_card = None;

                // Check win/loss conditions
                if game.matched_cards.len() == 12 {
                    game.state = GameState::Finished;
                    let multiplier = Self::calculate_multiplier(game.turn_count);
                    game.payout_multiplier = Some(multiplier);
                }
            }
        }

        self.state.active_game.set(Some(game.clone()));

        OperationResponse::CardRevealed {
            image_id: card_image_id,
            is_match: is_match_result,
            turn_count: game.turn_count,
            matched_cards_count: game.matched_cards.len(),
            game_state: game.state,
        }
    }

    async fn execute_claim_payout(&mut self) -> OperationResponse {
        let mut game = self.state.active_game.get().clone().expect("No active game to claim");
        
        assert!(game.state == GameState::Finished, "Game not finished");
        
        let multiplier = game.payout_multiplier.expect("Multiplier not calculated");
        let payout = (game.stake_amount as f64 * multiplier) as u64;

        if payout > 0 {
            const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";
            let token_app_id = match self.state.pulse_token_id.get() {
                Some(id) => *id,
                None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
            }.with_abi::<pulse_token::PulseTokenAbi>();
            
            let account_owner = AccountOwner::from_str(&game.owner).expect("Invalid owner address");

            let credit_op = pulse_token::Operation::GameCredit {
                owner: account_owner,
                amount: Amount::from_tokens(payout.into()),
            };

            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        game.state = GameState::Claimed;
        self.state.active_game.set(Some(game));

        OperationResponse::PayoutClaimed {
            payout_amount: payout,
        }
    }

    fn calculate_multiplier(turn_count: u8) -> f64 {
        match turn_count {
            6 => 20.0,
            7..=8 => 5.0,
            9..=10 => 3.0,
            11..=12 => 1.5,
            _ => 0.0,
        }
    }

    fn generate_shuffled_cards(&mut self) -> Vec<Card> {
        // Create 12 cards: 6 pairs (image_id 0-5, each appears twice)
        let mut cards = Vec::new();
        for position in 0..12 {
            let image_id = position / 2;  // 0,0,1,1,2,2,...,5,5
            cards.push(Card { position, image_id });
        }

        // Shuffle using on-chain randomness
        let mut shuffled = Vec::new();
        let mut remaining: Vec<u8> = (0..12).collect();
        let mut nonce = 0;

        while !remaining.is_empty() {
            let data = (self.runtime.chain_id(), self.runtime.system_time(), nonce);
            let bytes = bcs::to_bytes(&data).expect("Serialization failed");
            let seed = SeedWrapper(bytes);
            let hash = CryptoHash::new(&seed);
            let index = (hash.as_bytes()[0] as usize) % remaining.len();
            
            let position = remaining.remove(index);
            shuffled.push(cards[position as usize].clone());
            
            nonce += 1;
        }

        // Reassign positions to be sequential
        for (idx, card) in shuffled.iter_mut().enumerate() {
            card.position = idx as u8;
        }

        shuffled
    }
}