use async_graphql::{Enum, Request, Response};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::ApplicationId,
};
use serde::{Deserialize, Serialize};

pub struct ColorTradingAbi;

impl ContractAbi for ColorTradingAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for ColorTradingAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InstantiationArgument {
    pub pulse_token_id: ApplicationId,
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, Enum, PartialEq, Eq)]
pub enum Color {
    ColorA, // 30% - 3.0x
    ColorB, // 30% - 3.0x
    ColorC, // 15% - 6.0x
    ColorD, // 15% - 6.0x
    ColorE, // 10% - 9.0x
}

impl Color {
    pub fn multiplier(&self) -> u64 {
        match self {
            Color::ColorA | Color::ColorB => 300, // 3.0x (scaled by 100)
            Color::ColorC | Color::ColorD => 600, // 6.0x
            Color::ColorE => 900,                 // 9.0x
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    Bet { amount: u64, color: Color },
    Reveal,
    StartRound,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    // Internal messages if needed, currently none planned
}
