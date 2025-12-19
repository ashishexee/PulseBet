#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use mines::{Operation, MinesAbi, GameResult};
use state::{MinesState, Game};
use serde::{Serialize, Deserialize};

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
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MinesState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MinesContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        self.state.balance.set(1000);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::Bet { amount, mines_count } => self.execute_bet(amount, mines_count).await,
            Operation::Reveal { tile_id } => self.execute_reveal(tile_id).await,
            Operation::CashOut => self.execute_cashout().await,
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl MinesContract {
    async fn execute_bet(&mut self, amount: u64, mines_count: u8) {
        // Validation
        assert!(mines_count >= 1 && mines_count <= 24, "Invalid mines count");
        assert!(amount > 0, "Bet amount must be positive");
        
        let current_balance = *self.state.balance.get();
        assert!(current_balance >= amount, "Insufficient balance");

        // Check if game already active
        let active_game = self.state.active_game.get();
        if let Some(game) = active_game {
            assert!(game.result != GameResult::Active, "Game already active");
        }

        // Deduct balance
        self.state.balance.set(current_balance - amount);

        // Generate Mines (Pseudo-RNG)
        let mine_indices = self.generate_mines(mines_count);

        // Create new game
        let new_game = Game {
            mines_count,
            bet_amount: amount,
            revealed_tiles: Vec::new(),
            mine_indices,
            result: GameResult::Active,
            current_multiplier: 1.0, 
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
        } else {
            game.revealed_tiles.push(tile_id);
            
            // Calculate new multiplier ON-CHAIN
            let hits = game.revealed_tiles.len() as u64;
            let (base, step) = match game.mines_count {
                3 => (1.1, 0.2),
                5 => (1.4, 0.3),
                7 => (1.4, 0.5), // Confirmed 0.5 step for 7 mines
                _ => (1.0, 0.1), // Fallback
            };
            
            // Formula: Multiplier = Base + ((Hits - 1) * Step)
            // If hits = 0 (impossible here), mult is base.
            let new_mult = if hits == 0 { 
                1.0 
            } else {
                base + ((hits as f64 - 1.0) * step)
            };
            
            game.current_multiplier = new_mult;

            // Check Win Condition (All safe tiles revealed)
            let safe_tiles = 25 - game.mines_count;
            if game.revealed_tiles.len() as u8 == safe_tiles {
                game.result = GameResult::Won;
                let payout = (game.bet_amount as f64 * new_mult) as u64;
                let current_balance = *self.state.balance.get();
                self.state.balance.set(current_balance + payout);
            }
            
            self.state.active_game.set(Some(game));
        }
    }

    async fn execute_cashout(&mut self) {
        let mut game = self.state.active_game.get().clone().expect("No active game");
        assert!(matches!(game.result, GameResult::Active), "Game is over");

        let payout = (game.bet_amount as f64 * game.current_multiplier) as u64;
        let current_balance = *self.state.balance.get();
        self.state.balance.set(current_balance + payout);

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
