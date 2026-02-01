use coin_toss::GameLog;
use linera_sdk::{
    linera_base_types::ApplicationId,
    views::{RegisterView, RootView, ViewStorageContext},
};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct CoinTossState {
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub nonce: RegisterView<u64>,
    pub last_game: RegisterView<Option<GameLog>>,
}