use async_graphql::SimpleObject;
use linera_sdk::{
    linera_base_types::AccountOwner,
    views::{MapView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct WordleState {
    pub games: MapView<AccountOwner, GameSession>,
}

#[derive(Clone, Debug, Deserialize, Serialize, SimpleObject)]
pub struct GameSession {
    pub target_word: String,
    pub attempts: u8,
    pub guesses: Vec<String>,
    pub feedback_history: Vec<Vec<u8>>,
    pub is_won: bool,
    pub is_over: bool,
}
