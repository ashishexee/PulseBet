use async_graphql::{Request, Response};
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

pub struct WheelAbi;

impl ContractAbi for WheelAbi {
    type Operation = Operation;
    type Response = u8; // Returns winning segment index
}

impl ServiceAbi for WheelAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    SpinWheel { amount: u64, owner: String },
}

// 10 Segments (Clockwise from top?)
// Let's define multipliers.
// 0: Risk (0x)
// 1: Safety (1.5x)
// 2: Risk (0x)
// 3: Jackpot (10x)
// 4: Safety (1.2x)
// 5: Risk (0x)
// 6: Big Win (5x)
// 7: Safety (1.5x)
// 8: Risk (0x)
// 9: Good Win (3x)

pub const MULTIPLIERS: [u64; 10] = [
    0,    // 0
    150,  // 1
    0,    // 2
    1000, // 3 (Jackpot)
    120,  // 4
    0,    // 5
    500,  // 6
    150,  // 7
    0,    // 8
    300,  // 9
];
