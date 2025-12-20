#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::{WithContractAbi, ContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use mines::{Operation, MinesAbi, GameResult, InstantiationArgument};
use state::{MinesState, Game};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct MinesContract {
    state: MinesState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MinesContract);

impl WithContractAbi for MinesContract {
    type Abi = MinesAbi;
}

impl Contract for MinesContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MinesState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MinesContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::Bet { amount, mines_count, owner } => self.execute_bet(amount, mines_count, owner).await,
            Operation::Reveal { tile_id } => self.execute_reveal(tile_id).await,
            Operation::CashOut => self.execute_cashout().await,
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl MinesContract {
    async fn execute_bet(&mut self, amount: u64, mines_count: u8, owner: String) {
        // Validation
        assert!(mines_count >= 1 && mines_count <= 24, "Invalid mines count");
        assert!(amount > 0, "Bet amount must be positive");

        // Check if game already active
        let active_game = self.state.active_game.get();
        if let Some(game) = active_game {
            assert!(game.result != GameResult::Active, "Game already active");
        }

        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        
        // Debit tokens (Cross-App Call)
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(amount.into()),
        };
        
        self.runtime
            .call_application(true, token_app_id, &debit_op);

        // Generate Mines (Pseudo-RNG)
        let mine_indices = self.generate_mines(mines_count);

        // Create new game with owner
        let new_game = Game {
            owner: owner.clone(),
            mines_count,
            bet_amount: amount,
            revealed_tiles: Vec::new(),
            mine_indices,
            result: GameResult::Active,
            current_multiplier: 100, // 100 = 1.0x multiplier
        };

        self.state.active_game.set(Some(new_game));
    }

    async fn execute_reveal(&mut self, tile_id: u8) {
        assert!(tile_id < 25, "Invalid tile ID");

        let mut game = self.state.active_game.get().clone().expect("No active game");
        assert!(matches!(game.result, GameResult::Active), "Game is over");
        assert!(!game.revealed_tiles.contains(&tile_id), "Tile already revealed");

        // check mine
        if game.mine_indices.contains(&tile_id) {
            game.result = GameResult::Lost;
            game.revealed_tiles.push(tile_id);
            self.state.active_game.set(Some(game));
            // Lost - tokens already debited, no credit back
        } else {
            game.revealed_tiles.push(tile_id);
            
            // Calculate new multiplier ON-CHAIN (stored as percentage, 100 = 1.0x)
            let hits = game.revealed_tiles.len() as u64;
            // Base and step stored as percentage points
            let (base, step) = match game.mines_count {
                3 => (110, 20),   // 1.1x base, +0.2x per reveal
                5 => (140, 30),   // 1.4x base, +0.3x per reveal
                7 => (140, 50),   // 1.4x base, +0.5x per reveal
                _ => (100, 10),   // 1.0x base, +0.1x per reveal
            };
            
            let new_mult = if hits == 0 { 
                100  // 1.0x
            } else {
                base + ((hits - 1) * step)
            };
            
            game.current_multiplier = new_mult;

            // Check Win Condition (All safe tiles revealed)
            let safe_tiles = 25 - game.mines_count;
            if game.revealed_tiles.len() as u8 == safe_tiles {
                game.result = GameResult::Won;
                
                // Credit tokens on Win (Payout)
                // payout = bet * multiplier / 100
                let payout = (game.bet_amount * game.current_multiplier) / 100;
                
                let token_app_id = match self.state.pulse_token_id.get() {
                    Some(id) => *id,
                    None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
                };
                let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
                
                let account_owner = AccountOwner::from_str(&game.owner).expect("Invalid owner address");

                let credit_op = pulse_token::Operation::GameCredit {
                    owner: account_owner,
                    amount: Amount::from_tokens(payout.into()),
                };

                self.runtime
                    .call_application(true, token_app_id, &credit_op);
            }
            
            self.state.active_game.set(Some(game));
        }
    }

    async fn execute_cashout(&mut self) {
        let mut game = self.state.active_game.get().clone().expect("No active game");
        assert!(matches!(game.result, GameResult::Active), "Game is over");

        let payout = (game.bet_amount * game.current_multiplier) / 100; // Multiplier is percentage
        
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        let account_owner = AccountOwner::from_str(&game.owner).expect("Invalid owner address");

        let credit_op = pulse_token::Operation::GameCredit {
            owner: account_owner,
            amount: Amount::from_tokens(payout.into()),
        };

        self.runtime
            .call_application(true, token_app_id, &credit_op);

        game.result = GameResult::CashedOut;
        self.state.active_game.set(Some(game));
    }

    fn generate_mines(&mut self, count: u8) -> Vec<u8> {
        let mut mines = Vec::new();
        let mut nonce = 0;
        while mines.len() < count as usize {
            let data = (self.runtime.chain_id(), self.runtime.system_time(), nonce);
            let bytes = bcs::to_bytes(&data).expect("Serialization failed");
            let seed = SeedWrapper(bytes);
            let hash = CryptoHash::new(&seed);
            let byte = hash.as_bytes()[0];
            let tile = byte % 25;
            if !mines.contains(&tile) {
                mines.push(tile);
            }
            nonce += 1;
        }
        mines
    }
}
