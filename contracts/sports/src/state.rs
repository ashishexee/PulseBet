use linera_sdk::{
    linera_base_types::{AccountOwner, ApplicationId},
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};
use crate::BetStatus;

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct SportsState {
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub admin: RegisterView<Option<AccountOwner>>, 
    pub next_bet_id: RegisterView<u64>,
    pub live_bets: MapView<u64, LiveBet>,
    pub user_bets: MapView<(u64, AccountOwner), UserBet>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LiveBet {
    pub id: u64,
    pub question: String,
    pub odds: u64, 
    pub end_time: u64,
    pub status: BetStatus,
    pub result: Option<bool>, 
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct UserBet {
    pub amount: u64,
    pub prediction: bool,
    pub claimed: bool,
}