#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    abi::WithServiceAbi,
    views::{View, ViewStorageContext},
    Service, ServiceRuntime,
};
use memory_game::{GameState, MemoryGameAbi, Operation};
use state::{Card, Game, MemoryGameState};
use std::sync::Arc;


pub struct MemoryGameService {
    state: Arc<MemoryGameState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(MemoryGameService);

impl WithServiceAbi for MemoryGameService {
    type Abi = MemoryGameAbi;
}

impl Service for MemoryGameService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MemoryGameState::load(ViewStorageContext::from(runtime.root_view_storage_context()))
            .await
            .expect("Failed to load state");
        MemoryGameService { 
            state: Arc::new(state), 
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let game_opt = self.state.active_game.get();
        
        let active_game = game_opt.as_ref().map(|game| {
            GameResponse::from(game.clone())
        });

        let schema = Schema::build(
            QueryRoot { 
                active_game,
                state: self.state.clone(),
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

struct QueryRoot {
    active_game: Option<GameResponse>,
    state: Arc<MemoryGameState>,
}

#[Object]
impl QueryRoot {
    async fn active_game(&self) -> &Option<GameResponse> {
        &self.active_game
    }



    async fn cards(&self, player: String) -> Option<Vec<CardResponse>> {
        let game = self.state.active_game.get().as_ref()?;
        
        // Only return cards if the requesting player matches the game owner
        if game.owner == player {
            Some(
                game.cards
                    .iter()
                    .map(|c| CardResponse::from(c.clone()))
                    .collect()
            )
        } else {
            None
        }
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<MemoryGameService>>,
}

#[Object]
impl MutationRoot {
    async fn create_game(&self, stake_amount: u64, owner: String) -> Vec<u8> {
        let op = Operation::CreateGame { stake_amount, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn reveal_card(&self, card_id: u32) -> Vec<u8> {
        let op = Operation::RevealCard { card_id: card_id as u8 };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn claim_payout(&self) -> Vec<u8> {
        let op = Operation::ClaimPayout;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

// GraphQL Response Types
#[derive(Clone)]
struct GameResponse {
    player: String,
    stake_amount: u64,
    turn_count: u32,
    matched_cards_count: u32,
    matched_cards: Vec<u32>,
    first_revealed_card: Option<u32>,
    state: String,
    potential_payout: u64,
}

#[Object]
impl GameResponse {
    async fn player(&self) -> String {
        self.player.clone()
    }

    async fn stake_amount(&self) -> u64 {
        self.stake_amount
    }

    async fn turn_count(&self) -> u32 {
        self.turn_count
    }

    async fn matched_cards_count(&self) -> u32 {
        self.matched_cards_count
    }

    async fn matched_cards(&self) -> Vec<u32> {
        self.matched_cards.clone()
    }

    async fn first_revealed_card(&self) -> Option<u32> {
        self.first_revealed_card
    }

    async fn state(&self) -> String {
        self.state.clone()
    }

    async fn potential_payout(&self) -> u64 {
        self.potential_payout
    }
}

impl From<Game> for GameResponse {
    fn from(game: Game) -> Self {
        GameResponse {
            player: game.owner,
            stake_amount: game.stake_amount,
            turn_count: game.turn_count as u32,
            matched_cards_count: game.matched_cards.len() as u32,
            matched_cards: game.matched_cards.into_iter().map(|c| c as u32).collect(),
            first_revealed_card: game.first_revealed_card.map(|c| c as u32),
            state: match game.state {
                GameState::Playing => "PLAYING".to_string(),
                GameState::Finished => "FINISHED".to_string(),
                GameState::Claimed => "CLAIMED".to_string(),
            },
            potential_payout: calculate_potential_payout(game.stake_amount, game.turn_count),
        }
    }
}

fn calculate_potential_payout(stake_amount: u64, turn_count: u8) -> u64 {
    match turn_count {
        6 => stake_amount * 20,
        7..=8 => stake_amount * 5,
        9..=10 => stake_amount * 3,
        11..=12 => stake_amount * 3 / 2,
        _ => 0,
    }
}

#[derive(Clone)]
struct CardResponse {
    position: u32,
    image_id: u32,
}

#[Object]
impl CardResponse {
    async fn position(&self) -> u32 {
        self.position
    }

    async fn image_id(&self) -> u32 {
        self.image_id
    }
}

impl From<Card> for CardResponse {
    fn from(card: Card) -> Self {
        CardResponse {
            position: card.position as u32,
            image_id: card.image_id as u32,
        }
    }
}
