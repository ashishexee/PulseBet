use async_graphql::Enum;
use linera_sdk::{
    linera_base_types::{AccountOwner, ChainId},
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use memory_game::{RoomType, TurnOutcome};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Enum, Copy)]
pub enum RoomState {
    Waiting,
    InGame,
    Finished,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Copy, Enum)]
pub enum CardState {
    Hidden,
    Revealed,
    Removed,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Card {
    pub id: u8,
    pub image_id: u8,
    pub state: CardState,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq)]
pub struct Player {
    pub account_owner: AccountOwner,
    pub score: u8,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CardReveal {
    pub id: u8,
    pub image_id: u8,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TurnInfo {
    pub player: AccountOwner, // User changed Owner to AccountOwner previously
    pub card1: CardReveal,
    pub card2: CardReveal,
    pub outcome: TurnOutcome,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Room {
    pub room_id: ChainId,
    pub room_type: RoomType,
    pub room_code: Option<String>,
    pub player_1: Player,
    pub player_2: Option<Player>,
    pub state: RoomState,
    pub cards: Vec<Card>,
    pub current_turn: AccountOwner,
    pub last_turn: Option<TurnInfo>,
}

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct MemoryGame {
    pub rooms: MapView<ChainId, Room>,
    pub active_game: RegisterView<Option<ChainId>>,
}
