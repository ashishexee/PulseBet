#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema, SimpleObject};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use std::sync::Arc;
use sports::{Operation, SportsAbi, BetStatus};
use state::SportsState;

pub struct SportsService {
    state: SportsState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(SportsService);

impl WithServiceAbi for SportsService {
    type Abi = SportsAbi;
}

impl Service for SportsService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = SportsState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SportsService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // Fetch bets here because State cannot be cloned into QueryRoot
        let mut bets = Vec::new();
        let indices = self.state.live_bets.indices().await.unwrap_or_default();
        for id in indices {
            if let Ok(Some(bet)) = self.state.live_bets.get(&id).await {
                // Map storage struct to GraphQL struct
                bets.push(LiveBetObject {
                    id: bet.id,
                    question: bet.question,
                    odds: bet.odds,
                    end_time: bet.end_time,
                    status: bet.status,
                    result: bet.result,
                });
            }
        }
        bets.reverse();

        let schema = Schema::build(
            QueryRoot { bets },
            MutationRoot { runtime: self.runtime.clone() },
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

// --- GraphQL Structures ---

struct QueryRoot {
    bets: Vec<LiveBetObject>,
}

#[Object]
impl QueryRoot {
    async fn get_all_bets(&self) -> &Vec<LiveBetObject> {
        &self.bets
    }
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<SportsService>>,
}

#[Object]
impl MutationRoot {
    async fn post_live_bet(&self, question: String, odds: u64, duration: u64) -> Vec<u8> {
        let op = Operation::PostLiveBet { question, odds, duration_seconds: duration };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn place_bet(&self, bet_id: u64, amount: u64, prediction: bool, owner: String) -> Vec<u8> {
        let op = Operation::PlaceBet { bet_id, amount, prediction, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    async fn resolve_bet(&self, bet_id: u64, result: bool) -> Vec<u8> {
        let op = Operation::ResolveBet { bet_id, result };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
    
    async fn claim(&self, bet_id: u64, owner: String) -> Vec<u8> {
        let op = Operation::Claim { bet_id, owner };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}

#[derive(SimpleObject)]
pub struct LiveBetObject {
    pub id: u64,
    pub question: String,
    pub odds: u64,
    pub end_time: u64,
    pub status: BetStatus,
    pub result: Option<bool>,
}