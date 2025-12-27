use async_graphql::{Request, Response};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::ApplicationId,
};
use serde::{Deserialize, Serialize};

pub struct MemoryGameAbi;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InstantiationArgument {
    pub pulse_token_id: ApplicationId,
}

impl ContractAbi for MemoryGameAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for MemoryGameAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    CreateGame {
        stake_amount: u64, // Amount in tokens
        owner: String,     // Player address
    },
    RevealCard {
        card_id: u8,
    },
    ClaimPayout,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum OperationResponse {
    GameCreated {
        cards_count: usize,
    },
    CardRevealed {
        image_id: u8,
        is_match: Option<bool>, // None if first card, Some(true/false) if second card
        turn_count: u8,
        matched_cards_count: usize,
        game_state: GameState,
    },
    PayoutClaimed {
        payout_amount: u64,
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Copy)]
pub enum GameState {
    Playing,
    Finished,
    Claimed,
}
