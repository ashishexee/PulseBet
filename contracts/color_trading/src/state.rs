use color_trading::Color;
use linera_sdk::{
    linera_base_types::{AccountOwner, Amount, ApplicationId, Timestamp},
    views::{RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct ColorTradingState {
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub active_round: RegisterView<Option<Round>>,
}

#[derive(Clone, Debug, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct Round {
    pub round_id: u64,
    pub start_time: Timestamp,
    pub state: RoundState,
    pub winning_color: Option<Color>,
    pub bets: Vec<BetData>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq, async_graphql::Enum, Copy)]
pub enum RoundState {
    Betting,
    Revealing, // Waiting for Reveal tx
    Cooldown,  // Revealed, waiting for next round
}

#[derive(Clone, Debug, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct BetData {
    pub owner: AccountOwner,
    pub amount: Amount,
    pub color: Color,
    pub round_id: u64, // Tag bets with round_id so we don't mix them up
}
