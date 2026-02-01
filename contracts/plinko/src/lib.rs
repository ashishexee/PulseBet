use async_graphql::{Enum, Request, Response};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
    linera_base_types::ApplicationId,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InstantiationArgument {
    pub pulse_token_id: ApplicationId,
}

pub struct PlinkoAbi;

impl ContractAbi for PlinkoAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for PlinkoAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    StartGame { amount: u64, owner: String },
    AdvanceBatch { target_row: u8 },
}

#[derive(Debug, Deserialize, Serialize, Clone, Enum, Copy, PartialEq, Eq)]
pub enum GameResult {
    Won,  // Payout happened
    Lost, // Should strictly use Won/Active for Plinko since you always win *something* usually, but we keep Lost for coherence
    Active,
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Enum)]
pub enum Direction {
    Left,
    Right,
}

// Chaotic Multipliers (in %)
// Slot 0 to 8
pub const MULTIPLIERS: [u64; 9] = [
    1000, // Slot 0: JACKPOT (10.0x)
    25,   // Slot 1: (0.25x)
    150,  // Slot 2: (1.5x)
    50,   // Slot 3: (0.5x)
    250,  // Slot 4: Center (2.5x)
    50,   // Slot 5
    150,  // Slot 6
    25,   // Slot 7
    1000, // Slot 8: JACKPOT
];
