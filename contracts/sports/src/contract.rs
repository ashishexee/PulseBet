#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use sports::{Operation, SportsAbi, InstantiationArgument, BetStatus};
use state::{SportsState, LiveBet, UserBet};
use std::str::FromStr;

pub struct SportsContract {
    state: SportsState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(SportsContract);

impl WithContractAbi for SportsContract {
    type Abi = SportsAbi;
}

// Make sure to update this if you deploy a new Token!
const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl Contract for SportsContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = SportsState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        SportsContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
        let owner = self.runtime.authenticated_signer();
        self.state.admin.set(owner);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::PostLiveBet { question, odds, duration_seconds } => {
                let id = *self.state.next_bet_id.get();
                self.state.next_bet_id.set(id + 1);

                let current_time = self.runtime.system_time().micros();
                let end_time = current_time + (duration_seconds * 1_000_000);

                let bet = LiveBet {
                    id,
                    question,
                    odds,
                    end_time,
                    status: BetStatus::Open,
                    result: None,
                };
                
                self.state.live_bets.insert(&id, bet).expect("Failed to insert bet");
            },

            Operation::PlaceBet { bet_id, amount, prediction, owner } => {
                assert!(amount > 0, "Bet must be positive");
                let mut bet = self.state.live_bets.get(&bet_id).await.expect("Read failed").expect("Bet not found");
                
                let current_time = self.runtime.system_time().micros();
                if current_time > bet.end_time {
                    bet.status = BetStatus::Closed;
                    self.state.live_bets.insert(&bet_id, bet.clone()).expect("Failed to close bet");
                }
                assert_eq!(bet.status, BetStatus::Open, "Betting is closed");

                // Cross-App Call to PulseToken
                let token_app_id = self.get_token_id();
                let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
                
                let debit_op = pulse_token::Operation::GameDebit {
                    owner: account_owner,
                    amount: Amount::from_tokens(amount.into()),
                };
                
                self.runtime.call_application(true, token_app_id, &debit_op);

                let user_bet = UserBet {
                    amount,
                    prediction,
                    claimed: false,
                };
                
                self.state.user_bets.insert(&(bet_id, account_owner), user_bet).expect("Failed to record bet");
            },

            Operation::ResolveBet { bet_id, result } => {
                let mut bet = self.state.live_bets.get(&bet_id).await.expect("Read failed").expect("Bet not found");
                bet.status = BetStatus::Resolved;
                bet.result = Some(result);
                
                self.state.live_bets.insert(&bet_id, bet).expect("Failed to update bet");
            },

            Operation::Claim { bet_id, owner } => {
                let bet = self.state.live_bets.get(&bet_id).await.expect("Read failed").expect("Bet not found");
                assert_eq!(bet.status, BetStatus::Resolved, "Game not resolved yet");
                
                let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner");
                let mut user_bet = self.state.user_bets.get(&(bet_id, account_owner)).await
                    .expect("Read failed").expect("No bet found for user");
                
                assert!(!user_bet.claimed, "Already claimed");
                
                if let Some(outcome) = bet.result {
                    if user_bet.prediction == outcome {
                        // Winner Payout
                        let payout = (user_bet.amount * bet.odds) / 100;
                        let token_app_id = self.get_token_id();
                        
                        let credit_op = pulse_token::Operation::GameCredit {
                            owner: account_owner,
                            amount: Amount::from_tokens(payout.into()),
                        };
                        
                        self.runtime.call_application(true, token_app_id, &credit_op);
                    }
                }

                user_bet.claimed = true;
                self.state.user_bets.insert(&(bet_id, account_owner), user_bet).expect("Failed to update claim");
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl SportsContract {
    fn get_token_id(&mut self) -> ApplicationId<pulse_token::PulseTokenAbi> {
        match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        }
        .with_abi::<pulse_token::PulseTokenAbi>()
    }
}