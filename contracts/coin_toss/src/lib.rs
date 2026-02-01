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

pub struct CoinTossAbi;

impl ContractAbi for CoinTossAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for CoinTossAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    TossCoin {
        amount: u64,
        prediction: Prediction, // 0 for Heads, 1 for Tails
        owner: String,
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Enum)]
pub enum Prediction {
    Heads, // 0
    Tails, // 1
}

// Helper struct for Game Result (internal use)
#[derive(Debug, Deserialize, Serialize, Clone, async_graphql::SimpleObject)]
pub struct GameLog {
    pub owner: String,
    pub bet_amount: u64,
    pub prediction: u8, // 0: Heads, 1: Tails
    pub result: u8,     // 0: Heads, 1: Tails
    pub payout: u64,
    pub won: bool,
}
