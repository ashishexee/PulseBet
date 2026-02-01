#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use coin_toss::{Operation, CoinTossAbi, InstantiationArgument, Prediction, GameLog};
use state::CoinTossState;
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct CoinTossContract {
    state: CoinTossState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(CoinTossContract);

impl WithContractAbi for CoinTossContract {
    type Abi = CoinTossAbi;
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl Contract for CoinTossContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = CoinTossState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        CoinTossContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::TossCoin { amount, prediction, owner } => {
                self.execute_toss(amount, prediction, owner).await
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl CoinTossContract {
    async fn execute_toss(&mut self, amount: u64, prediction: Prediction, owner: String) {
        assert!(amount > 0, "Bet amount must be positive");
        
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID)
                        .expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        let signer = self.runtime.authenticated_signer();
        assert_eq!(signer, Some(account_owner), "Operation must be signed by the owner");

        // 1. Debit Tokens
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(amount.into()),
        };
        self.runtime.call_application(true, token_app_id, &debit_op);

        // 2. Generate Randomness (0 or 1)
        let nonce = *self.state.nonce.get();
        self.state.nonce.set(nonce + 1);

        let data = (self.runtime.chain_id(), self.runtime.system_time(), amount, nonce, "COIN_TOSS");
        let bytes = bcs::to_bytes(&data).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHash::new(&seed);
        
        let roll = (hash.as_bytes()[0] as u64) % 2; 
        
        let result_prediction = if roll == 0 { Prediction::Heads } else { Prediction::Tails };

        // 3. Determine Win/Loss
        let won = prediction == result_prediction;
        let payout = if won { amount * 2 } else { 0 };

        if won && payout > 0 {
             let credit_op = pulse_token::Operation::GameCredit {
                owner: account_owner,
                amount: Amount::from_tokens(payout.into()),
            };
            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        // 4. Save State active_game / last_game
        let game_log = GameLog {
            owner,
            bet_amount: amount,
            prediction: if prediction == Prediction::Heads { 0 } else { 1 },
            result: roll as u8,
            payout,
            won,
        };
        self.state.last_game.set(Some(game_log));
    }
}
