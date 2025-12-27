use crate::GameState;
use linera_sdk::{
    bcs,
    linera_base_types::ApplicationId,
    views::{RegisterView, RootView, View, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MemoryGameState {
    pub active_game: RegisterView<Option<Game>>,
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Game {
    pub owner: String,    
    pub stake_amount: u64, 
    pub cards: Vec<Card>,
    pub matched_cards: Vec<u8>,
    pub first_revealed_card: Option<u8>,
    pub turn_count: u8,
    pub state: GameState,
    pub payout_multiplier: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Card {
    pub position: u8,
    pub image_id: u8,
}
