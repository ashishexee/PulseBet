use linera_sdk::views::{RegisterView, RootView, ViewStorageContext};
use mines::GameResult;
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MinesState {
    pub active_game: RegisterView<Option<Game>>,
    pub balance: RegisterView<u64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Game {
    pub mines_count: u8,
    pub bet_amount: u64,
    pub revealed_tiles: Vec<u8>,
    pub mine_indices: Vec<u8>,
    pub result: GameResult,
    pub current_multiplier: f64,
}
