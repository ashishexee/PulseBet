// contracts/sports/tests/single_chain.rs

#![cfg(not(target_arch = "wasm32"))]

use linera_sdk::{
    test::{QueryOutcome, TestValidator},
    linera_base_types::ApplicationId,
};
use sports::{SportsAbi, InstantiationArgument, Operation};
use std::str::FromStr;

#[tokio::test(flavor = "multi_thread")]
async fn single_chain_test() {
    // 1. Setup the Validator (Local Blockchain Simulation)
    let (validator, bytecode_id) = 
        TestValidator::with_current_module::<SportsAbi, InstantiationArgument, ()>().await;
    let mut chain = validator.new_chain().await;

    // 2. Mock a "PulseToken" App ID
    // We just need a valid-looking ID to pass initialization.
    let dummy_token_id = ApplicationId::from_str(
        "8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961"
    ).unwrap();

    // 3. Instantiate the Sports App
    let argument = InstantiationArgument {
        pulse_token_id: dummy_token_id,
    };

    let app_id = chain
        .create_application(bytecode_id, argument, (), vec![])
        .await;

    // 4. Test: Post a Live Bet (The Oracle Action)
    // "Will Kohli hit a 6?" with 2.5x odds (250) for 60 seconds
    let post_op = Operation::PostLiveBet {
        question: "Will Kohli hit a 6?".to_string(),
        odds: 250, 
        duration_seconds: 60,
    };

    chain
        .add_block(|block| {
            block.with_operation(app_id, post_op);
        })
        .await;

    // 5. Query: Verify the bet exists
    let query = "query { getAllBets { id question odds status } }";
    let QueryOutcome { response, .. } = chain.graphql_query(app_id, query).await;

    // 6. Assertions
    let bets = response["getAllBets"].as_array().expect("Expected an array of bets");
    assert_eq!(bets.len(), 1, "Should have exactly 1 bet");
    
    let bet = &bets[0];
    assert_eq!(bet["question"], "Will Kohli hit a 6?");
    assert_eq!(bet["odds"], 250);
    assert_eq!(bet["status"], "Open");

    println!("✅ Sports Contract: Bet Creation & Query Test Passed!");
}