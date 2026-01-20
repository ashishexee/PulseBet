#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::{WithContractAbi, ContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use plinko::{Operation, PlinkoAbi, GameResult, InstantiationArgument, Direction, MULTIPLIERS};
use state::{PlinkoState, Game};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct PlinkoContract {
    state: PlinkoState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(PlinkoContract);

impl WithContractAbi for PlinkoContract {
    type Abi = PlinkoAbi;
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl Contract for PlinkoContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = PlinkoState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PlinkoContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::StartGame { amount, owner } => self.execute_start_game(amount, owner).await,
            Operation::AdvanceBatch { target_row } => self.execute_advance_batch(target_row).await,
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl PlinkoContract {
    async fn execute_start_game(&mut self, amount: u64, owner: String) {
        assert!(amount > 0, "Bet amount must be positive");

        let active_game = self.state.active_game.get();
        if let Some(game) = active_game {
            assert!(matches!(game.result, GameResult::Won | GameResult::Lost), "Game already active"); // Only allow new game if previous is done
        }

        // 1. Debit Tokens (Cross-Call) -----------------------------------------------------------
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(amount.into()),
        };
        
        self.runtime.call_application(true, token_app_id, &debit_op);

        // 2. Initialize Game ---------------------------------------------------------------------
        // We start at Row 0, but we immediately compute Step 1 (Row 1) as part of the start.
        // This gives immediate feedback.
        
        let mut new_game = Game {
            owner: owner.clone(),
            bet_amount: amount,
            current_row: 0,
            current_col: 0,
            path: Vec::new(),
            result: GameResult::Active,
            final_multiplier: 0,
        };
        
        // Auto-advance to Row 1
        self.process_steps(&mut new_game, 1);

        self.state.active_game.set(Some(new_game));
    }

    async fn execute_advance_batch(&mut self, target_row: u8) {
        // Validation
        let mut game = self.state.active_game.get().clone().expect("No active game");
        assert!(matches!(game.result, GameResult::Active), "Game is already finished");
        assert!(target_row > game.current_row, "Target row must be advancing");
        assert!(target_row <= 8, "Cannot go beyond Row 8");
        
        // Allowed Checkpoints: 3, 5, 7, 8
        // Or if user fell behind (retries), allow catching up to next checkpoint.
        
        self.process_steps(&mut game, target_row);

        // Check completion
        if game.current_row == 8 {
            self.finalize_game(&mut game).await;
        }

        self.state.active_game.set(Some(game));
    }

    fn process_steps(&mut self, game: &mut Game, target_row: u8) {
        let steps_needed = target_row - game.current_row;
        let mut nonce = game.path.len() as u64; // Use path length as nonce to keep uniqueness per step

        for _ in 0..steps_needed {
            // RNG
            let data = (self.runtime.chain_id(), self.runtime.system_time(), nonce);
            let bytes = bcs::to_bytes(&data).expect("Serialization failed");
            let seed = SeedWrapper(bytes);
            let hash = CryptoHash::new(&seed);
            let byte = hash.as_bytes()[0];
            
            // 50/50 Chance
            let is_right = byte % 2 == 0;
            let direction = if is_right { Direction::Right } else { Direction::Left };
            
            if is_right {
                game.current_col += 1;
            } else {
                game.current_col -= 1;
            }
            
            game.path.push(direction);
            game.current_row += 1;
            nonce += 1;
        }
    }

    async fn finalize_game(&mut self, game: &mut Game) {
        // Map Final Column (Col 8, ranges from -8 to +8 in steps of 2)
        // Range: -8, -6, -4, -2, 0, 2, 4, 6, 8. (9 positions)
        // Map: (-8 -> 0), (-6 -> 1) ... (8 -> 8).
        // Formula: (col + 8) / 2
        
        let col = game.current_col;
        let slot_index = (col + 8) / 2;
        
        assert!(slot_index >= 0 && slot_index <= 8, "Logic error in slot calculation");
        
        let multiplier_percent = MULTIPLIERS[slot_index as usize];
        
        // Payout
        let payout = (game.bet_amount * multiplier_percent) / 100;
        
        if payout > 0 {
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

            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        game.result = GameResult::Won;
        game.final_multiplier = multiplier_percent;
    }
}
