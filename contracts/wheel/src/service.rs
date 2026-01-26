#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use wheel::{Operation, WheelAbi};
use state::WheelState;

pub struct WheelService {
    state: WheelState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(WheelService);

impl WithServiceAbi for WheelService {
    type Abi = WheelAbi;
}

impl Service for WheelService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = WheelState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        WheelService {
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
                result_segment: game.result_segment,
                multiplier: game.multiplier,
                payout: game.payout,
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
    runtime: Arc<ServiceRuntime<WheelService>>,
}

#[Object]
impl MutationRoot {
    async fn spin_wheel(&self, amount: u64, owner: String) -> Vec<u8> {
        let op = Operation::SpinWheel { amount, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct PublicGame {
    pub owner: String,
    pub bet_amount: u64,
    pub result_segment: u8,
    pub multiplier: u64,
    pub payout: u64,
}
