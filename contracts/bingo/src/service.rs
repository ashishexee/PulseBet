// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use bingo::{BingoGameAbi, Operation, GameRoom};
use linera_sdk::{
    abi::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use self::state::BingoState;
use async_graphql::{EmptySubscription, Object, Schema, SimpleObject};
use std::sync::Arc;
 
pub struct BingoService {
    state: BingoState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(BingoService);

impl WithServiceAbi for BingoService {
    type Abi = BingoGameAbi;
}

impl Service for BingoService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = BingoState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        BingoService { 
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Self::Query) -> Self::QueryResponse {
        let mutation_root = MutationRoot {
            runtime: self.runtime.clone(),
        };
        
        // Use a dedicated QueryRoot that holds a snapshot of data
        let query_root = QueryRoot {
            room: self.state.room.get().clone(),
        };

        let schema = Schema::build(
            query_root,
            mutation_root, 
            EmptySubscription
        ).finish();
        
        schema.execute(request).await
    }
}

#[derive(SimpleObject)]
struct QueryRoot {
    room: Option<GameRoom>,
}

struct MutationRoot {
    runtime: Arc<ServiceRuntime<BingoService>>,
}

#[Object]
impl MutationRoot {
    /// Create a new game room hosting on this chain
    async fn create_game(&self, player_name: String) -> Vec<u8> {
        let op = Operation::CreateGame { player_name };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    /// Join a game hosted on another chain
    async fn join_game(&self, host_chain_id: String, player_name: String) -> Vec<u8> {
        let op = Operation::JoinGame { host_chain_id, player_name };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    /// Pick a number
    async fn pick_number(&self, number: u32) -> Vec<u8> {
        let op = Operation::PickNumber { number };
        self.runtime.schedule_operation(&op);
        Vec::new()
    }

    /// Leave the current game
    async fn leave_game(&self) -> Vec<u8> {
        let op = Operation::LeaveGame;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
    
    async fn hard_reset(&self) -> Vec<u8> {
        let op = Operation::HardReset;
        self.runtime.schedule_operation(&op);
        Vec::new()
    }
}
