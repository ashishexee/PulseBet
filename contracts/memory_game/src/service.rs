#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use state::{MemoryGame, Room, RoomState, Card, CardState, Player, TurnInfo};
use memory_game::{MemoryGameAbi, RoomType, TurnOutcome, Operation}; // Import shared enums
use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    linera_base_types::ChainId,
    views::View,
    Service, ServiceRuntime,
};
use memory_game::MemoryGameParameters; // Added this import
use std::sync::Arc;

pub struct MemoryGameService {
    state: Arc<MemoryGame>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(MemoryGameService);

impl WithServiceAbi for MemoryGameService {
    type Abi = MemoryGameAbi;
}

impl Service for MemoryGameService {
    type Parameters = MemoryGameParameters;

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MemoryGame::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MemoryGameService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            Query {
                state: self.state.clone(), 
                runtime: self.runtime.clone(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

#[derive(Clone)]
struct Query {
    state: Arc<MemoryGame>,
    runtime: Arc<ServiceRuntime<MemoryGameService>>,
}

#[derive(Clone)]
struct MutationRoot {
    runtime: Arc<ServiceRuntime<MemoryGameService>>,
}

#[Object]
impl MutationRoot {
    async fn create_room(&self, room_type: RoomType, room_code: Option<String>) -> Vec<u8> {
        self.runtime
            .schedule_operation(&Operation::CreateRoom {
                room_type,
                room_code,
            });
        vec![]
    }

    async fn join_room(&self, room_id: ChainId, room_code: Option<String>) -> Vec<u8> {
        self.runtime
            .schedule_operation(&Operation::JoinRoom { room_id, room_code });
        vec![]
    }

    async fn play_turn(&self, room_id: ChainId, card_ids: Vec<u8>) -> Vec<u8> {
        if card_ids.len() != 2 {
            // GraphQL validation usually happens before, but good to be safe.
            // But we can't easily return error here without Result.
            // Just schedule, contract will panic if invalid.
        }
        let fixed_ids: [u8; 2] = [card_ids[0], card_ids[1]];
        self.runtime
            .schedule_operation(&Operation::PlayTurn {
                room_id,
                card_ids: fixed_ids,
            });
        vec![]
    }

    async fn end_room(&self, room_id: ChainId) -> Vec<u8> {
        self.runtime
            .schedule_operation(&Operation::EndGame { room_id });
        vec![]
    }

    async fn start_game(&self, room_id: ChainId) -> Vec<u8> {
        self.runtime
            .schedule_operation(&Operation::StartGame { room_id });
        vec![]
    }
}

#[Object]
impl Query {
    async fn room(&self, room_id: ChainId) -> Option<PublicRoom> {
        let room = self.state.rooms.get(&room_id).await.ok().flatten()?;
        Some(room.into())
    }

    async fn creation_chain_id(&self) -> ChainId {
        self.runtime.application_parameters().creation_chain_id
    }

    async fn public_rooms(&self, limit: Option<u32>) -> Vec<PublicRoom> {
        let mut rooms = Vec::new();
        let limit = limit.unwrap_or(10) as usize;
        
        // Manual iteration as indices() returns a Vec
        if let Ok(keys) = self.state.rooms.indices().await {
             let mut count = 0;
             for chain_id in keys {
                 if let Ok(Some(room)) = self.state.rooms.get(&chain_id).await {
                     if room.state == RoomState::Waiting {
                         if let RoomType::Public = room.room_type {
                             rooms.push(room.into());
                             count += 1;
                             if count >= limit {
                                 break;
                             }
                         }
                     }
                 }
             }
        }
        rooms
    }

    async fn active_game(&self) -> Option<ChainId> {
        self.state.active_game.get().clone()
    }
}

#[derive(SimpleObject)]
pub struct PublicRoom {
    pub room_id: String,
    pub room_type: RoomType,
    pub room_code: Option<String>,
    pub player_1: PublicPlayer,
    pub player_2: Option<PublicPlayer>,
    pub state: RoomState,
    pub cards: Vec<PublicCard>,
    pub current_turn: String,
    pub last_turn: Option<PublicTurnInfo>,
}

#[derive(SimpleObject)]
pub struct PublicPlayer {
    pub owner: String,
    pub score: u8,
}

#[derive(SimpleObject)]
pub struct PublicCard {
    pub id: u8,
    pub image_id: u8,
    pub state: CardState,
}

#[derive(SimpleObject)]
pub struct PublicCardReveal {
    pub id: u8,
    pub image_id: u8,
}

#[derive(SimpleObject)]
pub struct PublicTurnInfo {
    pub player: String,
    pub card1: PublicCardReveal,
    pub card2: PublicCardReveal,
    pub outcome: TurnOutcome,
}

// Conversions

impl From<Room> for PublicRoom {
    fn from(r: Room) -> Self {
        PublicRoom {
            room_id: r.room_id.to_string(), // ChainId Display
            room_type: r.room_type,
            room_code: r.room_code,
            player_1: r.player_1.into(),
            player_2: r.player_2.map(|p| p.into()),
            state: r.state,
            cards: r.cards.into_iter().map(|c| c.into()).collect(),
            current_turn: r.current_turn.to_string(), // AccountOwner Display?
            last_turn: r.last_turn.map(|t| t.into()),
        }
    }
}

impl From<Player> for PublicPlayer {
    fn from(p: Player) -> Self {
        PublicPlayer {
            owner: p.account_owner.to_string(),
            score: p.score,
        }
    }
}

impl From<Card> for PublicCard {
    fn from(c: Card) -> Self {
        let image_id = if c.state == CardState::Hidden { 0 } else { c.image_id };
        PublicCard {
            id: c.id,
            image_id,
            state: c.state,
        }
    }
}

impl From<TurnInfo> for PublicTurnInfo {
    fn from(t: TurnInfo) -> Self {
        PublicTurnInfo {
            player: t.player.to_string(),
            card1: PublicCardReveal { id: t.card1.id, image_id: t.card1.image_id },
            card2: PublicCardReveal { id: t.card2.id, image_id: t.card2.image_id },
            outcome: t.outcome,
        }
    }
}
