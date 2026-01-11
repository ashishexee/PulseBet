#![cfg_attr(target_arch = "wasm32", no_main)]

use async_graphql::{EmptySubscription, Object, Schema, Request, Response};
use linera_sdk::{
    abi::WithServiceAbi,
    linera_base_types::CryptoHash,
    views::View, // Added View traits
    Service, ServiceRuntime,
    graphql::GraphQLMutationRoot,
};
use dots_and_boxes::{DotsAndBoxesAbi, Operation, state::{DotsAndBoxesState, GameState}};
use std::sync::Arc;

pub struct DotsAndBoxesService {
    state: Arc<DotsAndBoxesState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(DotsAndBoxesService);

impl WithServiceAbi for DotsAndBoxesService {
    type Abi = DotsAndBoxesAbi;
}

impl Service for DotsAndBoxesService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = Arc::new(
            DotsAndBoxesState::load(runtime.root_view_storage_context())
                .await
                .expect("Failed to load state"),
        );
        DotsAndBoxesService { state, runtime: Arc::new(runtime) }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot { state: self.state.clone() },
            Operation::mutation_root(self.runtime.clone()), // Added runtime argument
            EmptySubscription,
        ).finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    state: Arc<DotsAndBoxesState>,
}

#[Object]
impl QueryRoot {
    async fn game(&self, game_id: CryptoHash) -> Option<GameState> {
        self.state.games.get(&game_id).await.ok().flatten()
    }
}
