use async_graphql::{Enum, Request, Response};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

pub struct MinesAbi;

impl ContractAbi for MinesAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for MinesAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    Bet { amount: u64, mines_count: u8 },
    Reveal { tile_id: u8 },
    CashOut,
}

#[derive(Debug, Deserialize, Serialize, Clone, Enum, Copy, PartialEq, Eq)]
pub enum GameResult {
    Won,
    Lost,
    CashedOut,
    Active,
}
