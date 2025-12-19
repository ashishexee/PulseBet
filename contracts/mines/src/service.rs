#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use mines::{Operation, MinesAbi, GameResult};
use state::MinesState;

pub struct MinesService {
    state: MinesState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(MinesService);

impl WithServiceAbi for MinesService {
    type Abi = MinesAbi;
}

impl Service for MinesService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = MinesState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MinesService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let balance = *self.state.balance.get();
        let game_opt = self.state.active_game.get();
        
        let public_game = game_opt.as_ref().map(|game| {
            let mine_indices = if matches!(game.result, GameResult::Active) {
                Vec::new() 
            } else {
                game.mine_indices.clone()
            };

            PublicGame {
                mines_count: game.mines_count,
                bet_amount: game.bet_amount,
                revealed_tiles: game.revealed_tiles.clone(),
                mine_indices,
                result: game.result,
                current_multiplier: game.current_multiplier,
            }
        });

        let schema = Schema::build(
            QueryRoot { public_game, balance },
            MutationRoot { runtime: self.runtime.clone() },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    public_game: Option<PublicGame>,
    balance: u64,
}

#[Object]
impl QueryRoot {
    async fn balance(&self) -> u64 {
        self.balance
    }

    async fn active_game(&self) -> &Option<PublicGame> {
        &self.public_game
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<MinesService>>,
}

#[Object]
impl MutationRoot {
    async fn bet(&self, amount: u64, mines_count: u8) -> Vec<u8> {
        let op = Operation::Bet { amount, mines_count };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn reveal(&self, tile_id: u8) -> Vec<u8> {
        let op = Operation::Reveal { tile_id };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn cash_out(&self) -> Vec<u8> {
        let op = Operation::CashOut;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct PublicGame {
    pub mines_count: u8,
    pub bet_amount: u64,
    pub revealed_tiles: Vec<u8>,
    pub mine_indices: Vec<u8>, 
    pub result: GameResult,
    pub current_multiplier: f64,
}
