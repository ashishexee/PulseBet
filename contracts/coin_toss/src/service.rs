#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use coin_toss::{CoinTossAbi, Operation, Prediction, GameLog};
use state::CoinTossState;
use std::sync::Arc;

pub struct CoinTossService {
    state: CoinTossState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(CoinTossService);

impl WithServiceAbi for CoinTossService {
    type Abi = CoinTossAbi;
}

impl Service for CoinTossService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = CoinTossState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CoinTossService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Self::Query) -> Self::QueryResponse {
        let query_root = QueryRoot { 
            last_game: self.state.last_game.get().clone() 
        };
        
        Schema::build(
            query_root,
            MutationRoot,
            EmptySubscription,
        )
        .finish()
        .execute(request)
        .await
    }
}

pub struct QueryRoot {
    last_game: Option<GameLog>,
}

#[Object]
impl QueryRoot {
    async fn last_game(&self) -> Option<GameLog> {
        self.last_game.clone()
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn play_toss(&self, amount: u64, prediction: Prediction, owner: String) -> Vec<u8> {
        let operation = Operation::TossCoin {
            amount,
            prediction,
            owner,
        };
        bcs::to_bytes(&operation).expect("Serialization failed")
    }
}
