#![cfg_attr(target_arch = "wasm32", no_main)]

#[cfg(test)]
#[path = "unit_tests.rs"]
mod unit_tests;

use linera_sdk::{
    linera_base_types::{AccountOwner, CryptoHash, WithContractAbi, ChainId},
    views::{View, RootView}, // Added View traits
    Contract, ContractRuntime,
};
use dots_and_boxes::{DotsAndBoxesAbi, Operation, Message, Line, GameStatus, state::{DotsAndBoxesState, GameState}}; // Imported state from lib
use std::collections::{BTreeSet, BTreeMap};

pub struct DotsAndBoxesContract {
    state: DotsAndBoxesState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(DotsAndBoxesContract);

impl WithContractAbi for DotsAndBoxesContract {
    type Abi = DotsAndBoxesAbi;
}

impl Contract for DotsAndBoxesContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = (); // Accept any argument to avoid mismatch errors
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = DotsAndBoxesState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        DotsAndBoxesContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        // Empty state is initialized by default view
        self.state.games.clear();
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::CreateGame { game_id, size } => self.create_game(game_id, size).await,
            Operation::JoinGame { game_id, host_chain_id } => {
                let player = self.runtime.authenticated_signer().expect("User must be signed");
                // FIX: Get our local chain ID to send to the host
                let my_chain_id = self.runtime.chain_id();
                
                let message = Message::JoinGame { 
                    game_id, 
                    player,
                    player_chain_id: my_chain_id 
                };
                self.runtime.send_message(host_chain_id, message);
            },
            Operation::MakeMove { game_id, line, host_chain_id } => {
                let player = self.runtime.authenticated_signer().expect("User must be signed");
                let message = Message::MakeMove { game_id, line, player };
                self.runtime.send_message(host_chain_id, message);
            },
            Operation::ClaimVictory { .. } => {}, // impl later
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
           Message::JoinGame { game_id, player, player_chain_id } => {
                self.do_join_game(game_id, player, player_chain_id).await;
                self.sync_state(game_id).await;
            },
            Message::MakeMove { game_id, line, player } => {
                self.do_make_move(game_id, line, player).await;
                self.sync_state(game_id).await;
            },
            Message::SyncState { game_id, state } => {
                // Determine complexity: If we blindly trust, anyone can overwrite our state.
                // In a real app, verify `message.authenticated_signer`.
                // For now, allow it to sync.
                self.state.games.insert(&game_id, state).expect("Failed to sync state");
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl DotsAndBoxesContract {
    async fn create_game(&mut self, game_id: CryptoHash, size: u8) {
        let owner = self.runtime.authenticated_signer().expect("User must be signed");
        let chain_id = self.runtime.chain_id();

        // Ensure ID is unique
        if self.state.games.get(&game_id).await.expect("View error").is_some() {
             panic!("Game ID already exists");
        }

        let game = GameState {
            player1: owner,
            player1_chain_id: chain_id,
            player2: None,
            player2_chain_id: None,
            current_turn: owner,
            grid_size: size,
            horizontal_lines: BTreeSet::new(),
            vertical_lines: BTreeSet::new(),
            squares: BTreeMap::new(),
            status: GameStatus::Lobby,
            scores: vec![0, 0],
            winner: None,
        };

        self.state.games.insert(&game_id, game).expect("Failed to insert game");
    }

    async fn do_join_game(&mut self, game_id: CryptoHash, player: AccountOwner, player_chain_id: ChainId) {
        // Use explicit match to debug "Game not found" vs "Deserialization error"
        let mut game = match self.state.games.get(&game_id).await {
            Ok(Some(g)) => g,
            _ => return, // Ignore if game not found or error
        };
        
        // Assertions can technically panic and rollback, which is fine for "logic" errors like "Game full",
        // but for "Game ID not found" (cross-chain mismatch), it's better to drop.
        // For stricter robustness, we could check conditions and return if invalid.
        if game.status != GameStatus::Lobby || game.player2.is_some() || game.player1 == player {
             return;
        }

        game.player2 = Some(player);
        game.player2_chain_id = Some(player_chain_id);
        game.status = GameStatus::Active;
        // Turn stays with P1 (creator) initially
        self.state.games.insert(&game_id, game).expect("Failed to update game");
    }

    async fn do_make_move(&mut self, game_id: CryptoHash, mut line: Line, player: AccountOwner) {
        let mut game = match self.state.games.get(&game_id).await {
             Ok(Some(g)) => g,
             _ => return,
        };

        // Checks
        if game.status != GameStatus::Active || game.current_turn != player {
            return;
        }
        
        // Normalize line
        if line.start > line.end {
            std::mem::swap(&mut line.start, &mut line.end);
        }

        // Validate Line Geometry
        assert!(game.is_valid_line(&line), "Invalid line");
        
        // Normalize line for storage
        if line.start > line.end {
            std::mem::swap(&mut line.start, &mut line.end);
        }

        // Check if already drawn
        let is_horizontal = line.start.row == line.end.row;
        if is_horizontal {
            assert!(!game.horizontal_lines.contains(&line), "Line already drawn");
            game.horizontal_lines.insert(line);
        } else {
            assert!(!game.vertical_lines.contains(&line), "Line already drawn");
            game.vertical_lines.insert(line);
        }

        // Check Squares
        let completed_squares = game.check_completed_squares(&line);
        
        if !completed_squares.is_empty() {
             // Score update
             let new_squares_count = completed_squares.len() as u8;
             for sq_key in completed_squares {
                 game.squares.insert(sq_key, player);
             }
             
             if player == game.player1 {
                 game.scores[0] += new_squares_count;
             } else {
                 game.scores[1] += new_squares_count;
             }
             // EXTRA TURN: Do NOT switch current_turn
        } else {
           let opponent = game.player2.expect("Game must have two players before moves");

            game.current_turn = if player == game.player1 {
                opponent
            } else {
                game.player1
            };
        }

        // Check Win
        let total_squares = (game.grid_size as u16 - 1).pow(2); // Use u16 to avoid overflow
        let current_total = (game.scores[0] as u16) + (game.scores[1] as u16);
        
        if current_total == total_squares {
            game.status = GameStatus::Finished;
            if game.scores[0] > game.scores[1] {
                game.winner = Some(game.player1);
            } else if game.scores[1] > game.scores[0] {
                game.winner = game.player2;
            } else {
                game.winner = None; // Draw
            }
        }

        self.state.games.insert(&game_id, game).expect("Failed update");
    }

    async fn sync_state(&mut self, game_id: CryptoHash) {
        let game = match self.state.games.get(&game_id).await {
            Ok(Some(g)) => g,
            _ => return,
        };
        
        let message = Message::SyncState { game_id, state: game.clone() };
        
        // Send to Player 1
        self.runtime.send_message(game.player1_chain_id, message.clone());

        // Send to Player 2 if exists
        if let Some(chain_id) = game.player2_chain_id {
             self.runtime.send_message(chain_id, message);
        }
    }
}
