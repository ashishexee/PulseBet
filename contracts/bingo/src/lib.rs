// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use async_graphql::{Request, Response};
use linera_sdk::linera_base_types::{ChainId, ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

pub struct BingoGameAbi;

impl ContractAbi for BingoGameAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for BingoGameAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Constants
pub const BOARD_SIZE: usize = 25;

/// Game States
#[derive(Debug, Clone, Copy, Serialize, Deserialize, async_graphql::Enum, PartialEq, Eq)]
pub enum GameState {
    WaitingForPlayers,
    Playing,
    Ended,
}

/// Player Status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, async_graphql::Enum, PartialEq, Eq)]
pub enum PlayerStatus {
    Active,
    Left,
}

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
#[graphql(rename_fields = "camelCase")]
pub struct Player {
    pub chain_id: String,
    pub name: String,
    pub board: Vec<u32>,  
    pub marked: Vec<bool>, 
    pub is_winner: bool,
    pub status: PlayerStatus,
}

/// Game Room Structure (Stored on Host Chain)
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
#[graphql(rename_fields = "camelCase")]
pub struct GameRoom {
    pub room_id: String,       // Unique ID (e.g., timestamp)
    pub host_chain_id: String, // Chain ID of the host
    pub players: Vec<Player>,
    pub game_state: GameState,
    pub called_numbers: Vec<u32>,
    pub current_turn_index: Option<usize>, // Index in players vector
    pub winner_name: Option<String>,
    pub pot_amount: u32, // Virtual pot for now
}

impl GameRoom {
    pub fn new(host_chain_id: String, host_name: String, _timestamp: String) -> Self {
        // Generate random board for host
        let board = Self::generate_board(_timestamp.as_bytes()); // Simple pseudo-random for now

        let host_player = Player {
            chain_id: host_chain_id.clone(),
            name: host_name,
            board,
            marked: vec![false; BOARD_SIZE],
            is_winner: false,
            status: PlayerStatus::Active,
        };

        Self {
            room_id: _timestamp,
            host_chain_id,
            players: vec![host_player],
            game_state: GameState::WaitingForPlayers,
            called_numbers: Vec::new(),
            current_turn_index: None,
            winner_name: None,
            pot_amount: 0,
        }
    }

    /// Generate a 5x5 Bingo board (numbers 1-25) shuffled randomly based on a seed.
    pub fn generate_board(seed_bytes: &[u8]) -> Vec<u32> {
        let mut board: Vec<u32> = (1..=25).collect();

        // 1. Create a u64 seed from the bytes
        let mut seed = 0u64;
        for (i, &byte) in seed_bytes.iter().enumerate() {
            seed = seed.wrapping_add((byte as u64) << ((i % 8) * 8));
        }
        // Mixing step
        seed = seed.wrapping_mul(0x9E3779B97F4A7C15);

        // 2. Fisher-Yates shuffle with simple LCG
        let len = board.len();
        for i in (1..len).rev() {
            // Simple LCG: x = (a * x + c) % m
            seed = seed
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);

            let j = (seed as usize) % (i + 1);
            board.swap(i, j);
        }

        board
    }

    pub fn add_player(&mut self, player: Player) {
        if let Some(existing) = self
            .players
            .iter_mut()
            .find(|p| p.chain_id == player.chain_id)
        {
            existing.status = PlayerStatus::Active;
            existing.name = player.name; // Update name
        } else {
            self.players.push(player);
        }
    }
}

/// Operations (Executed by User)
#[derive(Debug, Serialize, Deserialize)]
pub enum Operation {
    /// Create a new game room on the current chain
    CreateGame { player_name: String },

    /// Join a remote game room
    JoinGame {
        host_chain_id: String,
        player_name: String,
    },

    /// Pick a number (if it's your turn)
    PickNumber { number: u32 },

    /// Leave the current game
    LeaveGame,

    /// Force Reset (Debug)
    HardReset,
}

/// Cross-Chain Messages (P2P Communication)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CrossChainMessage {
    /// Request to join a host's room
    JoinRequest {
        player_chain_id: ChainId,
        player_name: String,
    },

    /// Host sends complete room state to a new player
    InitialStateSync { room: GameRoom },

    /// Player sends their move to the Host
    PickNumberRequest { number: u32 },

    /// Notify Host that a player left
    PlayerLeft { player_chain_id: ChainId },

    /// Host notifies players that the room is closed/host left
    RoomDeleted,
}

/// Events (Emitted by Host to Subscribers)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BingoEvent {
    GameStarted {
        timestamp: String,
    },
    NumberPicked {
        number: u32,
        player_name: String,
        timestamp: String,
    },
    PlayerJoined {
        player_name: String,
        timestamp: String,
    },
    PlayerLeft {
        player_name: String,
        timestamp: String,
    },
    GameEnded {
        winner_name: String,
        timestamp: String,
    },
    TurnChanged {
        player_name: String,
        timestamp: String,
    },
}
