use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{Account, AccountOwner, Amount, ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct PulseTokenAbi;

impl ContractAbi for PulseTokenAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for PulseTokenAbi {
    type Query = Request;
    type QueryResponse = Response;
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    Transfer {
        owner: AccountOwner,
        amount: Amount,
        target_account: Account,
    },
    Mint {
        owner: AccountOwner,
        amount: Amount,
    },
    /// Called by Mines contract to debit tokens for betting
    GameDebit {
        owner: AccountOwner,
        amount: Amount,
    },
    /// Called by Mines contract to credit winnings
    GameCredit {
        owner: AccountOwner,
        amount: Amount,
    },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    Credit { owner: AccountOwner, amount: Amount },
}
