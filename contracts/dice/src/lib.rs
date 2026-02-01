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

pub struct DiceAbi;

impl ContractAbi for DiceAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for DiceAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    RollDice {
        amount: u64,
        target: u8,
        roll_type: RollType,
        owner: String,
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, Enum)]
pub enum RollType {
    Over,
    Under,
}

// Kept for State usage, but not as Response
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GameResult {
    pub roll: u8,
    pub won: bool,
    pub payout: u64,
    pub multiplier_x100: u64,
}
