# Wordle Smart Contract Specification

## Overview
A fully on-chain Wordle game where users guess a 5-letter word within 5 attempts. No staking or rewards involved—purely for entertainment.

## Architecture
- **Contract Type**: Solidity / Rust (depending on chain, assuming Rust/Linera based on "PulseBet" context usually implying Linera/Rust, but the user said "smart contract". I should check the existing codebase language. The summaries mention `ExecutionCoordinator.sol` (Solidity) and `contracts/mines/src/contract.rs` (Rust).
- **Wait**: I need to check which language to use. The previous task mentions `contracts/mines/src/contract.rs` (Rust/Linera) BUT also `ExecutionCoordinator.sol`.
- The user's prompt says "smart conntract" (generic).
- I will check the file structure to deduce the target language. `contracts/` usually has the contracts.

## Logic Specifications

### 1. Game State Management
The contract must handle multiple concurrent user sessions.
- **Mapping**: `User Address -> Game Session`

### 2. Word Storage
- A predefined list of 50 words (5-letter) hardcoded or stored in the contract.
- **Selection**: Pseudo-random selection using `block.timestamp` (or equivalent) + `user_address` salt.

### 3. Feedback Logic (The "0/1/2" System)
When a user submits a guess, the contract compares it with the target word:
- **0 (Grey)**: Letter not in word.
- **1 (Yellow)**: Letter in word but wrong position.
- **2 (Green)**: Letter in word and correct position.

**Handling Duplicates**: Standard Wordle rules apply.
- If target is "BBCDE" and guess is "BXBXX":
    - 1st 'B' is Green (2).
    - 2nd 'B' is Yellow (1) if it exists elsewhere, or Green if correct.
    - Accurate frequency counting is required so we don't mark a letter as Yellow if all instances of it in the target are already matched by Green/Yellows elsewhere.

### 4. Interfaces
**Inputs**:
- `start_game()`: Initializes a session.
- `submit_guess(string guess)`: accepts 5-letter string.

**Outputs**:
- Returns `[uint8; 5]` array (e.g., `[2, 0, 1, 0, 0]`).
- Returns `is_won` boolean.
- Returns `is_game_over` boolean.

### 5. Data Structures (Conceptual)
```rust
struct GameSession {
    target_word_index: u8,
    attempts: u8, // Max 5
    guesses: Vec<String>,
    is_active: bool,
    is_won: bool 
}
```
