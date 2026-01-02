#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    abi::WithServiceAbi,
    linera_base_types::AccountOwner,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use wordle::{Operation, WordleAbi};
use state::{WordleState, GameSession};

pub struct WordleService {
    state: Arc<WordleState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(WordleService);

impl WithServiceAbi for WordleService {
    type Abi = WordleAbi;
}

impl Service for WordleService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = WordleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        WordleService {
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
    state: Arc<WordleState>,
}

#[Object]
impl QueryRoot {
    async fn game(&self, owner: AccountOwner) -> Option<GameSession> {
        self.state.games.get(&owner).await.ok().flatten()
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<WordleService>>,
}

#[Object]
impl MutationRoot {
    async fn start_game(&self) -> Vec<u8> {
        let op = Operation::StartGame;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn submit_guess(&self, guess: String) -> Vec<u8> {
        let op = Operation::SubmitGuess { guess };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}
