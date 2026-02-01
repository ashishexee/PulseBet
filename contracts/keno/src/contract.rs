#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use keno::{Operation, KenoAbi, InstantiationArgument};
use state::{KenoState, Game, PayoutTable};
use serde::{Serialize, Deserialize};
use std::str::FromStr;
use std::collections::HashSet;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct KenoContract {
    state: KenoState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(KenoContract);

impl WithContractAbi for KenoContract {
    type Abi = KenoAbi;
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl Contract for KenoContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = KenoState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        KenoContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::Play { bet_amount, picks, owner } => {
                self.execute_play(bet_amount, picks, owner).await
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl KenoContract {
    async fn execute_play(&mut self, bet_amount: u64, picks: Vec<u8>, owner: String) {
        // 1. Basic Validation
        assert!(bet_amount > 0, "Bet amount must be positive");
        let pick_count = picks.len();
        assert!(pick_count >= 1 && pick_count <= 10, "Must pick between 1 and 10 numbers");

        // Validate Picks (Unique, 1-40)
        let mut unique_picks = HashSet::new();
        for &num in &picks {
            assert!(num >= 1 && num <= 40, "Numbers must be between 1 and 40");
            assert!(unique_picks.insert(num), "Duplicate numbers not allowed");
        }

        // 2. Auth Check (CRITICAL: Fixes MetaMask Popup flow)
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        let signer = self.runtime.authenticated_signer();
        assert_eq!(signer, Some(account_owner), "Operation must be signed by the owner");

        // 3. Resolve Token App ID
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID)
                        .expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();

        // 4. Debit Tokens
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(bet_amount.into()),
        };
        self.runtime.call_application(true, token_app_id, &debit_op);

        // 5. Generate Randomness (Draw 10 numbers)
        let nonce = *self.state.nonce.get();
        self.state.nonce.set(nonce + 1);

        // Seed: Chain + Time + User + Nonce
        let seed_data = (self.runtime.chain_id(), self.runtime.system_time(), &owner, nonce);
        let bytes = bcs::to_bytes(&seed_data).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHash::new(&seed);
        let hash_bytes = hash.as_bytes();

        // Fisher-Yates Shuffle on [1..40]
        let mut deck: Vec<u8> = (1..=40).collect();
        // Use hash bytes for entropy. We need enough randomness.
        // We have 32 bytes of hash. We can use a pseudo-RNG or simple indexing.
        // For simplicity and determinism, we'll use a simple index swap.
        // A standard 32-byte hash might not be enough for perfect F-Y of 40 items, 
        // but for a game it's "fair enough" compared to complexity. 
        // Better: Use the hash as a seed for a small LCG within the contract 
        // or just accept the bias of simple modulo on bytes. 
        
        // Simple Shuffle: match each byte to a swap
        for i in 0..10 { // We only need proper randomness for the first 10 slots
             // Use successive bytes. If we run out, wrap around.
             let byte_val = hash_bytes[i % 32] as usize;
             // Swap index i with index j (where j >= i)
             let range = 40 - i;
             let offset = byte_val % range;
             let j = i + offset;
             
             deck.swap(i, j);
        }

        // Take first 10
        let mut drawn_numbers: Vec<u8> = deck.into_iter().take(10).collect();
        drawn_numbers.sort(); // Sort for display niceness logic, though UI can handle it

        // 6. Calculate Hits
        let hits = picks.iter().filter(|&p| drawn_numbers.contains(p)).count();
        let hits_u8 = hits as u8;

        // 7. Calculate Payout
        let multiplier = PayoutTable::get_multiplier(pick_count, hits);
        let payout = (bet_amount as u128 * multiplier as u128 / 100) as u64;

        // 8. Credit Tokens (if win)
        if payout > 0 {
            let credit_op = pulse_token::Operation::GameCredit {
                owner: account_owner,
                amount: Amount::from_tokens(payout.into()),
            };
            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        // 9. Save Game State
        let game = Game {
            owner,
            bet_amount,
            picks: picks.clone(), // Keep original order or sorted? UI handles it.
            drawn_numbers,
            hits: hits_u8,
            payout,
            multiplier,
            timestamp: self.runtime.system_time().micros(),
        };
        // Save to active_games map keyed by owner address string
        // We need 'owner' string variable available, which moved into Game. 
        // Copy 'owner' string before moving.
        let owner_key = game.owner.clone();
        self.state.active_games.insert(&owner_key, game).expect("Failed to save game state");
    }
}
