#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    linera_base_types::{WithContractAbi,AccountOwner,Amount,Account},
    views::{RootView, View},
    Contract, ContractRuntime,
};
use std::str::FromStr;
use pulse_token::{Operation,Message};

use self::state::PulseTokenState;

pub struct PulseTokenContract {
    state: PulseTokenState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(PulseTokenContract);

impl WithContractAbi for PulseTokenContract {
    type Abi = pulse_token::PulseTokenAbi;
}

impl Contract for PulseTokenContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = PulseTokenState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        PulseTokenContract { state, runtime }
    }

    async fn instantiate(&mut self, argument: Self::InstantiationArgument) {
        let amount:Amount= Amount::from_str("1_000_000").unwrap();
        if let Some(owner)=self.runtime.authenticated_signer(){
            self.state.initialize_accounts(owner,amount).await;
        }
       
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Self::Response {
        match operation {
           Operation::Transfer { owner, amount, target_account } => {
            self.check_account_authentication(owner);
            self.state.debit(owner,amount).await;
            self.finish_transfer_to_account(amount,target_account).await;
        }
        // Handle Minting
            Operation::Mint { owner, amount } => {
                self.state.credit(owner, amount).await;
            }
        // Handle GameDebit (called by Mines contract for betting)
            Operation::GameDebit { owner, amount } => {
                self.state.debit(owner, amount).await;
            }
        // Handle GameCredit (called by Mines contract for winnings)
            Operation::GameCredit { owner, amount } => {
                self.state.credit(owner, amount).await;
            }
        }
    }

    async fn execute_message(&mut self, _message: Self::Message) {
        match _message{
            Message::Credit{amount, owner}=>{
                self.state.credit(owner,amount).await;
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl PulseTokenContract{
    fn check_account_authentication(&mut self , owner:AccountOwner){
        assert_eq!(
            self.runtime.authenticated_signer(),Some(owner),"Incorrect authentication"
        )
    }

    async fn finish_transfer_to_account(&mut self, amount: Amount, account: Account){
        if account.chain_id==self.runtime.chain_id(){
            self.state.credit(account.owner,amount).await;
        }else{
            let message=Message::Credit{
                owner:account.owner,
                amount
            };
            self.runtime.prepare_message(message).with_authentication().send_to(account.chain_id);
        }
    }
}
