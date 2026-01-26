use linera_sdk::{
    linera_base_types::ApplicationId,
    views::{RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct WheelState {
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub nonce: RegisterView<u64>,
    pub active_game: RegisterView<Option<Game>>,
}

#[derive(Debug, Default, Deserialize, Serialize, Clone)]
pub struct Game {
    pub owner: String,
    pub bet_amount: u64,
    pub result_segment: u8, // 0-9
    pub multiplier: u64,    // e.g. 200 = 2.0x
    pub payout: u64,
}
