#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use state::{Card, CardReveal, CardState, MemoryGame, Player, Room, RoomState, TurnInfo};
use memory_game::{MemoryGameAbi, Operation, RoomType, TurnOutcome, Message, MemoryGameParameters};
use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::AccountOwner,
    views::{View, RootView},
    Contract, ContractRuntime,
};


pub struct MemoryGameContract {
    state: MemoryGame,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(MemoryGameContract);

impl WithContractAbi for MemoryGameContract {
    type Abi = MemoryGameAbi;
}   

impl MemoryGameContract {
    fn shuffle_cards(&self, cards: &mut Vec<Card>, entropy: u64) {
        let mut rng = entropy;
        let len = cards.len();
        for i in (1..len).rev() {
            rng = rng.wrapping_mul(6364136223846793005).wrapping_add(1);
            let j = (rng as usize) % (i + 1);
            cards.swap(i, j);
        }
    }
}


impl Contract for MemoryGameContract {
    type Message = Message;
    type Parameters = MemoryGameParameters;
    type InstantiationArgument = ();
    type EventValue = ();

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = MemoryGame::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        MemoryGameContract { state, runtime }
    }

    async fn instantiate(
        &mut self,
        _argument: (),
    ) {
        // No initialization needed
    }

    async fn execute_operation(
        &mut self,
        operation: Operation,
    ) -> Self::Response {
        match operation {
            Operation::CreateRoom { room_type, room_code } => {
                let chain_id = self.runtime.chain_id();
                let owner = self.runtime.authenticated_signer().expect("Sender must be signed");
                
                if self.state.rooms.get(&chain_id).await.expect("Failed to fetch room").is_some() {
                    panic!("Room already exists for this chain");
                }

                let room = Room {
                    room_id: chain_id,
                    room_type,
                    room_code,
                    player_1: Player { account_owner: AccountOwner::from(owner), score: 0 },
                    player_2: None,
                    state: RoomState::Waiting,
                    cards: vec![],
                    current_turn: AccountOwner::from(owner), 
                    last_turn: None,
                };
                
                self.state.rooms.insert(&chain_id, room).expect("Failed to insert room");

                if let RoomType::Public = room_type {
                    let msg = Message::RegisterRoom { room_id: chain_id, owner: AccountOwner::from(owner) };
                    let creation_chain_id = self.runtime.application_parameters().creation_chain_id;
                    self.runtime.prepare_message(msg)
                        .with_authentication()
                        .send_to(creation_chain_id);
                }

                // Set active game for the host as well
                self.state.active_game.set(Some(chain_id));
            }
            Operation::JoinRoom { room_id, room_code } => {
                let owner = self.runtime.authenticated_signer().expect("Sender must be signed");
                let source_chain_id = self.runtime.chain_id();
                // If we are the host, we can't really join our own room as player 2 easily in this model without logic check,
                // but usually P2 is remote. WE SEND A MESSAGE TO THE HOST CHAIN.
                let msg = Message::RequestJoin { room_id, player_id: AccountOwner::from(owner), room_code, source_chain_id };
                self.runtime.prepare_message(msg)
                    .with_authentication()
                    .send_to(room_id);
            }
            Operation::PlayTurn { room_id, card_ids } => {
                let owner = self.runtime.authenticated_signer().expect("Sender must be signed");
                 let msg = Message::SubmitTurn { room_id, player_id: AccountOwner::from(owner), card_ids };
                self.runtime.prepare_message(msg)
                    .with_authentication()
                    .send_to(room_id);

            }
            Operation::StartGame { room_id } => {
                 let msg = Message::StartGame { room_id };
                 self.runtime.prepare_message(msg)
                    .with_authentication()
                    .send_to(room_id);
            }
            Operation::EndGame { room_id } => {
                 let msg = Message::EndGame { room_id };
                 self.runtime.prepare_message(msg)
                    .with_authentication()
                    .send_to(room_id);
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::RegisterRoom { room_id, owner } => {
                if self.state.rooms.get(&room_id).await.expect("Failed to get room").is_none() {
                     let room = Room {
                        room_id,
                        room_type: RoomType::Public,
                        room_code: None,
                        player_1: Player { account_owner: owner, score: 0 },
                        player_2: None,
                        state: RoomState::Waiting,
                        cards: vec![],
                        current_turn: owner, 
                        last_turn: None,
                    };
                    self.state.rooms.insert(&room_id, room).expect("Failed to insert lobby room");
                }
            }
            Message::UnregisterRoom { room_id } => {
                self.state.rooms.remove(&room_id).expect("Failed to remove room");
            }
            Message::RequestJoin { room_id, player_id, room_code, source_chain_id } => {
                 // Check if room exists on THIS chain (Host Chain)
                 if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to fetch room") {
                    if room.state != RoomState::Waiting {
                        // Game already started or finished, ignore or log
                        return;
                    }
                    
                    if let Some(code) = &room.room_code {
                         if let Some(input_code) = room_code {
                             if input_code != *code {
                                 // Invalid code
                                 return; 
                             }
                         } else {
                             // Code required
                             return;
                         }
                    }

                    // Prevent self-joining as Player 2 if strictly enforced, or allow for testing
                    // if room.player_1.AccountOwner == player_id { return; }

                    room.player_2 = Some(Player { account_owner: player_id, score: 0 });
                    
                    self.state.rooms.insert(&room_id, room).expect("Failed to update room");

                    // Send JoinAccepted confirmation back to the joining player's chain
                    // This tells P2 "You are in, wait for host to start"
                    let msg_accept = Message::JoinAccepted { room_id };
                    self.runtime.prepare_message(msg_accept)
                        .with_authentication()
                        .send_to(source_chain_id);
                 }
            }
            Message::StartGame { room_id } => {
                if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to fetch room") {
                     if room.state != RoomState::Waiting { return; }
                     if room.player_2.is_none() { return; } // Need 2 players

                     // Initialize Deck
                     let mut cards = Vec::new();
                     for i in 0..8 { // 8 Pairs = 16 cards
                         cards.push(Card { id: 0, image_id: i, state: CardState::Hidden });
                         cards.push(Card { id: 0, image_id: i, state: CardState::Hidden });
                     }
                     
                     for (i, card) in cards.iter_mut().enumerate() {
                         card.id = i as u8;
                     }
                     
                     let entropy = self.runtime.system_time().micros() as u64; 
                     self.shuffle_cards(&mut cards, entropy);
                     
                     room.cards = cards;
                     room.state = RoomState::InGame;
                     room.current_turn = room.player_1.account_owner; // Host starts
                     room.last_turn = None;
                     
                     self.state.rooms.insert(&room_id, room).expect("Failed to update room");

                     // Unregister from lobby if it was public
                      let msg = Message::UnregisterRoom { room_id };
                      let creation_chain_id = self.runtime.application_parameters().creation_chain_id;
                      self.runtime.prepare_message(msg)
                          .with_authentication()
                          .send_to(creation_chain_id);
                }
            }
            Message::SubmitTurn { room_id, player_id, card_ids } => {
                 if let Some(mut room) = self.state.rooms.get(&room_id).await.expect("Failed to fetch room") {
                    if room.state != RoomState::InGame { return; }
                    if room.current_turn != player_id { return; }
                    
                    let c1_idx_opt = room.cards.iter().position(|c| c.id == card_ids[0]);
                    let c2_idx_opt = room.cards.iter().position(|c| c.id == card_ids[1]);

                    if c1_idx_opt.is_none() || c2_idx_opt.is_none() { return; }
                    let c1_idx = c1_idx_opt.unwrap();
                    let c2_idx = c2_idx_opt.unwrap();
                    
                    if c1_idx == c2_idx { return; }
                    
                    let (c1, c2) = (room.cards[c1_idx].clone(), room.cards[c2_idx].clone());
                    
                    if c1.state != CardState::Hidden || c2.state != CardState::Hidden { return; }
                    
                    let is_match = c1.image_id == c2.image_id;
                    
                    let mut p1 = room.player_1.clone();
                    // Player 2 should exist if InGame
                    if room.player_2.is_none() { return; } 
                    let mut p2 = room.player_2.clone().unwrap();
                    
                    if is_match {
                         room.cards[c1_idx].state = CardState::Removed;
                         room.cards[c2_idx].state = CardState::Removed;
                         
                         if player_id == p1.account_owner {
                             p1.score += 1;
                         } else {
                             p2.score += 1;
                         }
                    }

                    room.last_turn = Some(TurnInfo {
                        player: player_id,
                        card1: CardReveal { id: c1.id, image_id: c1.image_id },
                        card2: CardReveal { id: c2.id, image_id: c2.image_id },
                        outcome: if is_match { TurnOutcome::Match } else { TurnOutcome::NoMatch },
                    });

                    // Switch turn
                    room.current_turn = if player_id == p1.account_owner { p2.account_owner } else { p1.account_owner };
                    
                    if room.cards.iter().all(|c| c.state == CardState::Removed) {
                        room.state = RoomState::Finished;
                    }
                    
                    room.player_1 = p1;
                    room.player_2 = Some(p2);
                    
                    self.state.rooms.insert(&room_id, room).expect("Failed to update room");
                 }
            }
             Message::EndGame { room_id } => {
                  if let Some(room) = self.state.rooms.get(&room_id).await.expect("Failed to fetch room") {
                       // We can check sender if we pass it, but `EndGame` msg usually has trust if authenticated?
                       // Or we should verify signature or just check logic. 
                       // For now, assume message sender == host logic check moved here?
                       // The authenticated_signer() is the SENDER of the message.
                       let sender = self.runtime.authenticated_signer().expect("Sender must be authenticated");
                       
                       if room.player_1.account_owner == AccountOwner::from(sender) {
                             self.state.rooms.remove(&room_id).expect("Failed to remove room");

                             if let RoomType::Public = room.room_type {
                                let msg = Message::UnregisterRoom { room_id };
                                let creation_chain_id = self.runtime.application_parameters().creation_chain_id;
                                self.runtime.prepare_message(msg)
                                    .with_authentication()
                                    .send_to(creation_chain_id);
                             }
                             
                             // Also clear local active game if we are the host?
                             // Host doesn't use active_game RegisterView? 
                             // We probably should for consistency, but Host usually tracks via Rooms map.
                       }
                  }
                  
                  // Also clear active game if I am a participant
                  self.state.active_game.set(None);
            }
            Message::JoinAccepted { room_id } => {
                // This message is received by the player who joined
                self.state.active_game.set(Some(room_id));
            }
            Message::GameStarted { .. } => {
                // Legacy handler or notification, currently redundant if active_game is set by JoinAccepted
                // But could be used to trigger UI sync if needed.
            }
        }
    }
}
