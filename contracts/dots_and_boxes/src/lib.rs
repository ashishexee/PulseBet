use async_graphql::{Request, Response, InputObject};
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::{CryptoHash, ChainId, AccountOwner},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

// Expose the state module
pub mod state; 

pub struct DotsAndBoxesAbi;

impl ContractAbi for DotsAndBoxesAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for DotsAndBoxesAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    CreateGame { game_id: CryptoHash, size: u8 },
    JoinGame { game_id: CryptoHash, host_chain_id: ChainId },
    MakeMove { game_id: CryptoHash, line: Line, host_chain_id: ChainId },
    ClaimVictory { game_id: CryptoHash, host_chain_id: ChainId },
}

// FIX 1: Add "Clone" here
#[derive(Debug, Deserialize, Serialize, Clone)] 
pub enum Message {
    JoinGame { 
        game_id: CryptoHash, 
        player: AccountOwner,
        // FIX 2: Explicitly pass the chain ID
        player_chain_id: ChainId 
    },
    MakeMove { 
        game_id: CryptoHash, 
        line: Line, 
        player: AccountOwner 
    },
    SyncState { 
        game_id: CryptoHash, 
        state: state::GameState 
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, InputObject, async_graphql::SimpleObject)]
#[graphql(input_name = "LineInput")]
pub struct Line {
    pub start: Dot,
    pub end: Dot,
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, InputObject, async_graphql::SimpleObject)]
#[graphql(input_name = "DotInput")]
pub struct Dot {
    pub row: u8,
    pub col: u8,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, async_graphql::Enum, Copy)]
pub enum GameStatus {
    Lobby,
    Active,
    Finished,
}