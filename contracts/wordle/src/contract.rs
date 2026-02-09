#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::{AccountOwner},
    views::{RootView, View},
    Contract, ContractRuntime,
};
use wordle::{Operation, WordleAbi};
use state::{WordleState, GameSession};

mod words;
use words::WORDS;

pub struct WordleContract {
    state: WordleState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(WordleContract);

impl WithContractAbi for WordleContract {
    type Abi = WordleAbi;
}

impl Contract for WordleContract {
    type Message = ();
    type InstantiationArgument = ();
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = WordleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        WordleContract { state, runtime }
    }

    async fn instantiate(&mut self, _arg: ()) {
        // Nothing to do on init
    }

    async fn execute_operation(&mut self, op: Operation) -> Self::Response {
        match op {
            Operation::StartGame => self.start_game().await,
            Operation::SubmitGuess { guess } => self.submit_guess(guess).await,
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {
        // No messages
    }
    
    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl WordleContract {
    async fn start_game(&mut self) {
        let owner = self.runtime.authenticated_signer().expect("User must be authenticated");
        let account_owner = AccountOwner::from(owner);
        let timestamp = self.runtime.system_time();
        
        // Fallback RNG: Serialize owner and mix with timestamp
        // This avoids CryptoHash trait issues
        let owner_bytes = bcs::to_bytes(&account_owner).expect("Failed to serialize owner");
        let mut seed: u64 = 0;
        for byte in owner_bytes {
            seed = seed.wrapping_add(byte as u64);
        }
        seed = seed.wrapping_add(timestamp.micros());
        
        // Simple linear congruential step to mix it further
        seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        
        let index = (seed as usize) % WORDS.len();
        
        let target_word = WORDS[index].to_string();
        
        let session = GameSession {
            target_word,
            attempts: 0,
            guesses: Vec::new(),
            feedback_history: Vec::new(),
            is_won: false,
            is_over: false,
        };
        self.state.games.insert(&account_owner, session).expect("Failed to save game");
    }

    async fn submit_guess(&mut self, guess: String) {
        let owner = self.runtime.authenticated_signer().expect("User must be authenticated");
        let account_owner = AccountOwner::from(owner);
        let mut session = self.state.games.get(&account_owner).await.expect("Failed to get game").expect("No game started");
        
        if session.is_over {
            panic!("Game is over");
        }
        if guess.len() != 5 {
            panic!("Guess must be 5 letters");
        }
        
        let guess = guess.to_uppercase();
        
        // Double check attempt limit
        if session.guesses.len() >= 5 {
             panic!("Max attempts reached");
        }

        let feedback = self.calculate_feedback(&session.target_word, &guess);
        session.guesses.push(guess);
        session.feedback_history.push(feedback.clone());
        session.attempts += 1;

        // Check Win
        if feedback.iter().all(|&x| x == 2) {
            session.is_won = true;
            session.is_over = true;
        } else if session.attempts >= 5 {
            session.is_over = true;
        }
        
        self.state.games.insert(&account_owner, session).expect("Failed to update game");
    }

    fn calculate_feedback(&self, target: &str, guess: &str) -> Vec<u8> {
        let target_chars: Vec<char> = target.chars().collect();
        let guess_chars: Vec<char> = guess.chars().collect();
        let mut feedback = vec![0; 5];
        let mut target_freq = std::collections::HashMap::new();

        for c in &target_chars {
            *target_freq.entry(c).or_insert(0) += 1;
        }
        for i in 0..5 {
            if guess_chars[i] == target_chars[i] {
                feedback[i] = 2;
                if let Some(count) = target_freq.get_mut(&guess_chars[i]) {
                    *count -= 1;
                }
            }
        }

        for i in 0..5 {
            if feedback[i] == 0 { 
                if let Some(count) = target_freq.get_mut(&guess_chars[i]) {
                    if *count > 0 {
                        feedback[i] = 1;
                        *count -= 1;
                    }
                }
            }
        }
        feedback
    }
}
