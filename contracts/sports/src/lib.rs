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

pub struct SportsAbi;

impl ContractAbi for SportsAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for SportsAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    PostLiveBet {
        question: String,
        odds: u64,
        duration_seconds: u64,
    },
    ResolveBet {
        bet_id: u64,
        result: bool,
    },
    PlaceBet {
        bet_id: u64,
        amount: u64,
        prediction: bool,
        owner: String,
    },
    Claim {
        bet_id: u64,
        owner: String,
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, Enum, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Open,
    Closed,
    Resolved,
}