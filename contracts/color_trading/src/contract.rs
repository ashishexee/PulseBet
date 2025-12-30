#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::{WithContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use color_trading::{Operation, ColorTradingAbi, Color, InstantiationArgument};
use state::{ColorTradingState, Round, RoundState, BetData};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct ColorTradingContract {
    state: ColorTradingState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(ColorTradingContract);

impl WithContractAbi for ColorTradingContract {
    type Abi = ColorTradingAbi;
}

impl Contract for ColorTradingContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = ColorTradingState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        ColorTradingContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
        let now = self.runtime.system_time();
        let first_round = Round {
            round_id: 1,
            start_time: now,
            state: RoundState::Betting,
            winning_color: None,
            bets: Vec::new(),
        };
        self.state.active_round.set(Some(first_round));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::Bet { amount, color } => self.execute_bet(amount, color).await,
            Operation::Reveal => self.execute_reveal().await,
            Operation::StartRound => self.execute_start_round().await,
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl ColorTradingContract {
    async fn execute_bet(&mut self, amount: u64, color: Color) {
        let mut round = self.state.active_round.get().clone().expect("No active round");
        let now = self.runtime.system_time();

        // Check Round State
        assert_eq!(round.state, RoundState::Betting, "Betting is closed");
        
        // Check Time (40s window)
        // 40 seconds = 40_000_000 microseconds
        let elapsed = now.micros().saturating_sub(round.start_time.micros());
        assert!(elapsed < 40_000_000, "Betting phase ended");
        assert!(amount > 0, "Bet amount must be positive");

        let owner = self.runtime.authenticated_signer().expect("User must be signed");

        // Debit tokens (CPI to PulseToken)
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        let debit_op = pulse_token::Operation::GameDebit {
            owner,
            amount: Amount::from_tokens(amount.into()),
        };
        
        self.runtime.call_application(true, token_app_id, &debit_op);

        // Record Bet
        let bet_data = BetData {
            owner,
            amount: Amount::from_tokens(amount.into()),
            color,
            round_id: round.round_id,
        };
        
        round.bets.push(bet_data);
        self.state.active_round.set(Some(round));
    }

    async fn execute_reveal(&mut self) {
        let mut round = self.state.active_round.get().clone().expect("No active round");
        let now = self.runtime.system_time();

        // Validations
        assert_eq!(round.state, RoundState::Betting, "Round not in Betting state");
        let elapsed = now.micros().saturating_sub(round.start_time.micros());
        assert!(elapsed >= 40_000_000, "Betting phase not yet over");

        // Generate Winning Color
        let rng_seed = (self.runtime.chain_id(), round.round_id, now);
        let bytes = bcs::to_bytes(&rng_seed).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHash::new(&seed);
        let random_val = hash.as_bytes()[0] % 100; // 0-99

        // Probabilities: A(30), B(30), C(15), D(15), E(10)
        // A: 0-29
        // B: 30-59
        // C: 60-74
        // D: 75-89
        // E: 90-99
        let winning_color = if random_val < 30 {
            Color::ColorA
        } else if random_val < 60 {
            Color::ColorB
        } else if random_val < 75 {
            Color::ColorC
        } else if random_val < 90 {
            Color::ColorD
        } else {
            Color::ColorE
        };

        round.winning_color = Some(winning_color);
        round.state = RoundState::Revealing; // Transient state, effectively we are doing it now.
        // Actually, let's just go straight to Cooldown after paying out.
        // But for clarity, we can set it.
        
        // Payout Winners
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();

        // Iterate all bets
        for bet in &round.bets {
            if bet.color == winning_color {
                let multiplier = winning_color.multiplier();
                let val: u128 = bet.amount.into();
                let payout_raw = (val * (multiplier as u128)) / 100;
                let payout = Amount::from_attos(payout_raw);

                let credit_op = pulse_token::Operation::GameCredit {
                    owner: bet.owner,
                    amount: payout,
                };
                self.runtime.call_application(true, token_app_id, &credit_op);
            }
        }

        // Update Round State
        round.state = RoundState::Cooldown;
        self.state.active_round.set(Some(round));
    }

    async fn execute_start_round(&mut self) {
        let current_round = self.state.active_round.get().clone();
        let now = self.runtime.system_time();

        let new_round_id = match current_round {
            Some(round) => {
                // If round exists, strictly enforce Cooldown state
                match round.state {
                    RoundState::Cooldown => {
                         let elapsed = now.micros().saturating_sub(round.start_time.micros());
                         assert!(elapsed >= 50_000_000, "Cooldown phase not yet over");
                    },
                    _ => panic!("Cannot start new round from current state"),
                }
                round.round_id + 1
            },
            None => 1, // If no round exists (recovery or fresh start), start at 1
        };

        let new_round = Round {
            round_id: new_round_id,
            start_time: now,
            state: RoundState::Betting,
            winning_color: None,
            bets: Vec::new(),
        };

        self.state.active_round.set(Some(new_round));
    }
}
