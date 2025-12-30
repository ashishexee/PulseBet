#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use linera_sdk::{
    linera_base_types::AccountOwner,
    views::View,
    Service, ServiceRuntime,
};
use color_trading::{Color, ColorTradingAbi, Operation};
use state::{ColorTradingState, Round, BetData};

pub struct ColorTradingService {
    state: Arc<ColorTradingState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(ColorTradingService);


use linera_sdk::abi::WithServiceAbi;

impl WithServiceAbi for ColorTradingService {
    type Abi = ColorTradingAbi;
}


impl Service for ColorTradingService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = ColorTradingState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ColorTradingService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            QueryRoot {
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
    state: Arc<ColorTradingState>,
}

#[Object]
impl QueryRoot {
    async fn active_round(&self) -> Option<Round> {
        self.state.active_round.get().clone()
    }

    async fn bet(&self, owner: AccountOwner) -> Option<BetData> {
        if let Some(round) = self.state.active_round.get() {
            return round.bets.iter().find(|b| b.owner == owner).cloned();
        }
        None
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<ColorTradingService>>,
}

#[Object]
impl MutationRoot {
    async fn bet(&self, amount: u64, color: Color) -> Vec<u8> {
        let op = Operation::Bet { amount, color };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn reveal(&self) -> Vec<u8> {
        let op = Operation::Reveal;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn start_round(&self) -> Vec<u8> {
        let op = Operation::StartRound;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

