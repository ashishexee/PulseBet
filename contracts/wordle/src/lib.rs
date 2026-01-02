use async_graphql::{Request, Response};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

pub struct WordleAbi;

impl ContractAbi for WordleAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for WordleAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    StartGame,
    SubmitGuess { guess: String },
}
