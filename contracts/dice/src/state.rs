use linera_sdk::{
    linera_base_types::ApplicationId,
    views::{RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct DiceState {
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub nonce: RegisterView<u64>,
    pub active_game: RegisterView<Option<Game>>,
}

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct Game {
    pub owner: String,
    pub bet_amount: u64,
    pub target: u8,
    pub result_roll: u8,
    pub payout: u64,
    pub multiplier: u64, // x100
}
