use async_graphql::Enum;
use linera_sdk::{
    abi::{ContractAbi, ServiceAbi},
    linera_base_types::{AccountOwner, ChainId},
};
use serde::{Deserialize, Serialize};

pub struct MemoryGameAbi;
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MemoryGameParameters {
    pub creation_chain_id: ChainId,
}

impl ContractAbi for MemoryGameAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for MemoryGameAbi {
    type Query = async_graphql::Request;
    type QueryResponse = async_graphql::Response;
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Copy, Enum)]
pub enum RoomType {
    Public,
    Private,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    CreateRoom {
        room_type: RoomType,
        room_code: Option<String>,
    },
    JoinRoom {
        room_id: ChainId,
        room_code: Option<String>,
    },
    PlayTurn {
        room_id: ChainId,
        card_ids: [u8; 2],
    },
    EndGame {
        room_id: ChainId,
    },
    StartGame {
        room_id: ChainId,
    },
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Copy, Enum)]
pub enum TurnOutcome {
    Match,
    NoMatch,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    RegisterRoom {
        room_id: ChainId,
        owner: AccountOwner,
    },
    UnregisterRoom {
        room_id: ChainId,
    },
    RequestJoin {
        room_id: ChainId,
        player_id: AccountOwner,
        room_code: Option<String>,
        source_chain_id: ChainId,
    },
    JoinAccepted {
        room_id: ChainId,
    },
    SubmitTurn {
        room_id: ChainId,
        player_id: AccountOwner,
        card_ids: [u8; 2],
    },
    StartGame {
        room_id: ChainId,
    },
    EndGame {
        room_id: ChainId,
    },
    GameStarted {
        room_id: ChainId,
    },
}
