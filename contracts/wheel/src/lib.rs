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
    type Response = Vec<u8>; // Returns winning segment index as bytes
}

impl ServiceAbi for WheelAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    SpinWheel { amount: u64, owner: String },
}

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
