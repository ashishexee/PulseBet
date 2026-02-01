use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::ApplicationId,
};
use serde::{Deserialize, Serialize};

pub struct KenoAbi;

impl ContractAbi for KenoAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for KenoAbi {
    type Query = async_graphql::Request;
    type QueryResponse = async_graphql::Response;
}

#[derive(Debug, Deserialize, Serialize)]
pub struct InstantiationArgument {
    pub pulse_token_id: ApplicationId,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    Play {
        bet_amount: u64,
        picks: Vec<u8>,
        owner: String,
    },
}
