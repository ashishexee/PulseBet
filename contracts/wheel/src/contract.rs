#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use wheel::{Operation, WheelAbi, InstantiationArgument, MULTIPLIERS};
use state::{WheelState, Game};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct WheelContract {
    state: WheelState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(WheelContract);

impl WithContractAbi for WheelContract {
    type Abi = WheelAbi;
}

const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";

impl Contract for WheelContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = (); // No events for now, direct response

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = WheelState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        WheelContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::SpinWheel { amount, owner } => self.execute_spin(amount, owner).await,
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl WheelContract {
    async fn execute_spin(&mut self, amount: u64, owner: String) -> u8 {
        assert!(amount > 0, "Bet amount must be positive");

        // 1. Debit Tokens (Cross-Call)
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID).expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(amount.into()),
        };
        
        self.runtime.call_application(true, token_app_id, &debit_op);

        // 2. RNG (Spin Logic)
        // Seed = ChainID + Timestamp + Nonce (active game count or specialized nonce)
        // We'll use system_time as primary entropy + amount to vary it
        let data = (self.runtime.chain_id(), self.runtime.system_time(), amount);
        let bytes = bcs::to_bytes(&data).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHash::new(&seed);
        
        // Take first byte mod 10 for 10 segments (simple uniform distribution)
        // For production, maybe use u16 mod 360 for degrees, but mod 10 is fine for this hackathon
        let segment_index = (hash.as_bytes()[0] % 10) as u8;

        // 3. Calculate Result
        let multiplier = MULTIPLIERS[segment_index as usize];
        let payout = (amount * multiplier) / 100;

        // 4. Credit Tokens (if won)
        if payout > 0 {
             let credit_op = pulse_token::Operation::GameCredit {
                owner: account_owner,
                amount: Amount::from_tokens(payout.into()),
            };
            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        // 5. Save History (Optional, keeps last game state)
        let game = Game {
            owner,
            bet_amount: amount,
            result_segment: segment_index,
            multiplier,
            payout,
        };
        self.state.active_game.set(Some(game));

        // 6. Return Result
        segment_index
    }
}
