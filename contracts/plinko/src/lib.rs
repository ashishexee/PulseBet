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
    777, // Slot 0: JACKPOT (7.77x)
    10,  // Slot 1: Trap (0.1x)
    100, // Slot 2: Good Win (1.0x)
    5,   // Slot 3: Bad Trap (0.05x)
    33,  // Slot 4: Center (0.33x)
    5,   // Slot 5
    100, // Slot 6
    10,  // Slot 7
    777, // Slot 8: JACKPOT
];
