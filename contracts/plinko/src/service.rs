#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use plinko::{Operation, PlinkoAbi, GameResult, Direction};
use state::PlinkoState;

pub struct PlinkoService {
    state: PlinkoState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(PlinkoService);

impl WithServiceAbi for PlinkoService {
    type Abi = PlinkoAbi;
}

impl Service for PlinkoService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = PlinkoState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PlinkoService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let game_opt = self.state.active_game.get();
        
        let public_game = game_opt.as_ref().map(|game| {
            PublicGame {
                owner: game.owner.clone(),
                bet_amount: game.bet_amount,
                current_row: game.current_row,
                current_col: game.current_col,
                path: game.path.clone(),
                result: game.result,
                final_multiplier: game.final_multiplier,
            }
        });

        let schema = Schema::build(
            QueryRoot { public_game },
            MutationRoot { runtime: self.runtime.clone() },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    public_game: Option<PublicGame>,
}

#[Object]
impl QueryRoot {
    async fn active_game(&self) -> &Option<PublicGame> {
        &self.public_game
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<PlinkoService>>,
}

#[Object]
impl MutationRoot {
    async fn start_game(&self, amount: u64, owner: String) -> Vec<u8> {
        let op = Operation::StartGame { amount, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn advance_batch(&self, target_row: u8) -> Vec<u8> {
        let op = Operation::AdvanceBatch { target_row };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct PublicGame {
    pub owner: String,
    pub bet_amount: u64,
    pub current_row: u8,
    pub current_col: i8,
    pub path: Vec<Direction>,
    pub result: GameResult,
    pub final_multiplier: u64,
}
