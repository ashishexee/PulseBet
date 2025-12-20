#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    graphql::GraphQLMutationRoot, Service,
    ServiceRuntime,
    linera_base_types::{AccountOwner, Amount, WithServiceAbi},
    views::{MapView, View}
};

use pulse_token::Operation;

use self::state::PulseTokenState;

#[derive(Clone)] 
pub struct PulseTokenService {
    state: Arc<PulseTokenState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(PulseTokenService);

impl WithServiceAbi for PulseTokenService {
    type Abi = pulse_token::PulseTokenAbi;
}

impl Service for PulseTokenService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = PulseTokenState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PulseTokenService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        Schema::build(
            self.clone(), 
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish()
        .execute(request)
        .await
    }
}


#[Object]
impl PulseTokenService {
    async fn balance(&self, owner: String) -> Amount {
        let account_owner: AccountOwner = owner.parse().expect("Invalid account owner format");
        self.state.accounts
            .get(&account_owner)
            .await
            .expect("Failed to read from MapView")
            .unwrap_or_default() 
    }
}
