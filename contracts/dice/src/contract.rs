#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::{WithContractAbi, ContractAbi},
    views::{RootView, View},
    Contract, ContractRuntime,
    linera_base_types::{AccountOwner, Amount, ApplicationId},
};
use linera_base::crypto::{CryptoHash, BcsHashable};
use dice::{Operation, DiceAbi, InstantiationArgument, RollType, GameResult};
use state::{DiceState, Game};
use serde::{Serialize, Deserialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize)]
struct SeedWrapper(Vec<u8>);

impl<'de> BcsHashable<'de> for SeedWrapper {}

pub struct DiceContract {
    state: DiceState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(DiceContract);

impl WithContractAbi for DiceContract {
    type Abi = DiceAbi;
}


const PULSE_TOKEN_APP_ID: &str = "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961";
const HOUSE_EDGE_PERCENT: u64 = 0; 

impl Contract for DiceContract {
    type Message = ();
    type Parameters = ();
    type InstantiationArgument = InstantiationArgument;
    type EventValue = (); 

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = DiceState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        DiceContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: InstantiationArgument) {
        self.state.pulse_token_id.set(Some(argument.pulse_token_id));
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::RollDice { amount, target, roll_type, owner } => {
                self.execute_roll(amount, target, roll_type, owner).await
            }
        }
    }

    async fn execute_message(&mut self, _message: ()) { }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl DiceContract {
    async fn execute_roll(&mut self, amount: u64, target: u8, roll_type: RollType, owner: String) {
        assert!(amount > 0, "Bet amount must be positive");
        assert!(target >= 1 && target <= 98, "Target must be between 1 and 98"); 
        let token_app_id = match self.state.pulse_token_id.get() {
            Some(id) => *id,
            None => ApplicationId::from_str(PULSE_TOKEN_APP_ID)
                        .expect("Invalid hardcoded PulseToken App ID"),
        };
        let token_app_id = token_app_id.with_abi::<pulse_token::PulseTokenAbi>();
        let account_owner = AccountOwner::from_str(&owner).expect("Invalid owner address");
        let signer = self.runtime.authenticated_signer();
        assert_eq!(signer, Some(account_owner), "Operation must be signed by the owner");

        // 3. Debit Tokens
        let debit_op = pulse_token::Operation::GameDebit {
            owner: account_owner,
            amount: Amount::from_tokens(amount.into()),
        };
        self.runtime.call_application(true, token_app_id, &debit_op);

        // 4. Generate Randomness (0-99)
        let nonce = *self.state.nonce.get();
        self.state.nonce.set(nonce + 1);

        let data = (self.runtime.chain_id(), self.runtime.system_time(), amount, nonce, target);
        let bytes = bcs::to_bytes(&data).expect("Serialization failed");
        let seed = SeedWrapper(bytes);
        let hash = CryptoHash::new(&seed);
        
        let roll = (hash.as_bytes()[0] as u64) % 100; 
        let roll = roll as u8; // 0 to 99

        // 5. Determine Win/Loss & Multiplier
        let (won, win_chance) = match roll_type {
            RollType::Under => (roll < target, target as u64),
            RollType::Over => (roll >= target, 100 - target as u64),
        };

        let multiplier_x100 = if win_chance == 0 { 0 } else {
             (100 * (100 - HOUSE_EDGE_PERCENT)) / win_chance
        };

        let payout = if won {
            (amount * multiplier_x100) / 100
        } else {
            0
        };
        if won && payout > 0 {
             let credit_op = pulse_token::Operation::GameCredit {
                owner: account_owner,
                amount: Amount::from_tokens(payout.into()),
            };
            self.runtime.call_application(true, token_app_id, &credit_op);
        }

        // 7. Save State
        let game = Game {
            owner,
            bet_amount: amount,
            target,
            result_roll: roll,
            payout,
            multiplier: multiplier_x100,
        };
        self.state.active_game.set(Some(game));
    }
}
