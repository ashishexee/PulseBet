#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Schema, Request, Response, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use keno::{Operation, KenoAbi};
use state::KenoState;

pub struct KenoService {
    state: Arc<KenoState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(KenoService);

impl WithServiceAbi for KenoService {
    type Abi = KenoAbi;
}

impl Service for KenoService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = KenoState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        KenoService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot { state: self.state.clone() },
            MutationRoot { runtime: self.runtime.clone() },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    state: Arc<KenoState>,
}

#[Object]
impl QueryRoot {
    async fn last_game(&self, owner: String) -> Option<PublicGame> {
        let game = self.state.active_games.get(&owner).await.ok().flatten()?;
        Some(PublicGame {
            owner: game.owner,
            bet_amount: game.bet_amount,
            picks: game.picks,
            drawn_numbers: game.drawn_numbers,
            hits: game.hits,
            payout: game.payout,
            multiplier: game.multiplier,
            timestamp: game.timestamp,
        })
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<KenoService>>,
}

#[Object]
impl MutationRoot {
    async fn play_keno(&self, bet_amount: u64, picks: Vec<u8>, owner: String) -> Vec<u8> {
        let op = Operation::Play {
            bet_amount,
            picks,
            owner,
        };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct PublicGame {
    pub owner: String,
    pub bet_amount: u64,
    pub picks: Vec<u8>,
    pub drawn_numbers: Vec<u8>,
    pub hits: u8,
    pub payout: u64,
    pub multiplier: u64,
    pub timestamp: u64,
}
