use linera_sdk::{
    linera_base_types::ApplicationId,
    views::{RegisterView, RootView, ViewStorageContext},
};
use plinko::{Direction, GameResult};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct PlinkoState {
    pub active_game: RegisterView<Option<Game>>,
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Game {
    pub owner: String,
    pub bet_amount: u64,
    pub current_row: u8, // 0 to 8
    pub current_col: i8, // 0 start. -1 Left, +1 Right.
    pub path: Vec<Direction>,
    pub result: GameResult,
    pub final_multiplier: u64,
}
