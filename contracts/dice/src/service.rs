#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use dice::{Operation, DiceAbi, RollType};
use state::DiceState;

pub struct DiceService {
    state: DiceState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(DiceService);

impl WithServiceAbi for DiceService {
    type Abi = DiceAbi;
}

impl Service for DiceService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = DiceState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        DiceService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let game_opt = self.state.active_game.get();
        
        let public_game = game_opt.as_ref().map(|game| PublicGame {
            owner: game.owner.clone(),
            bet_amount: game.bet_amount,
            target: game.target,
            result_roll: game.result_roll,
            payout: game.payout,
            multiplier: game.multiplier,
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
    runtime: Arc<ServiceRuntime<DiceService>>,
}

#[Object]
impl MutationRoot {
    async fn roll_dice(&self, amount: u64, target: u8, roll_type: RollType, owner: String) -> Vec<u8> {
        let op = Operation::RollDice { amount, target, roll_type, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct PublicGame {
    pub owner: String,
    pub bet_amount: u64,
    pub target: u8,
    pub result_roll: u8,
    pub payout: u64,
    pub multiplier: u64, 
}
