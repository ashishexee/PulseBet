use super::*;
use crate::{state::{GameState, GameStatus}, Line, Dot};
use linera_sdk::{
    linera_base_types::{AccountOwner, CryptoHash},
    test::TestRuntime,
};
use std::collections::{BTreeSet, BTreeMap};

// Helper to create a clean state
fn create_test_game(size: u8) -> GameState {
    let p1 = AccountOwner::from(CryptoHash::new(b"p1"));
    let chain_id = linera_sdk::linera_base_types::ChainId::from(CryptoHash::new(b"chain1"));
    GameState {
        player1: p1,
        player1_chain_id: chain_id,
        player2: None,
        player2_chain_id: None,
        current_turn: p1,
        grid_size: size,
        horizontal_lines: BTreeSet::new(),
        vertical_lines: BTreeSet::new(),
        squares: BTreeMap::new(),
        status: GameStatus::Active,
        scores: vec![0, 0],
        winner: None,
    }
}

fn make_line(r1: u8, c1: u8, r2: u8, c2: u8) -> Line {
    Line { start: Dot{row: r1, col: c1}, end: Dot{row: r2, col: c2} }
}

#[test]
fn test_move_validation_strict_length_1() {
    let game = create_test_game(4);

    // 1. Valid horizontal (len 1)
    let valid_h = make_line(0, 0, 0, 1);
    assert!(game.is_valid_line(&valid_h), "Should confirm valid horizontal line");

    // 2. Valid vertical (len 1)
    let valid_v = make_line(0, 0, 1, 0);
    assert!(game.is_valid_line(&valid_v), "Should confirm valid vertical line");

    // 3. Invalid: Length 2 Horizontal
    let long_h = make_line(0, 0, 0, 2);
    assert!(!game.is_valid_line(&long_h), "Should reject horizontal line of length 2");

    // 4. Invalid: Length 2 Vertical
    let long_v = make_line(0, 0, 2, 0);
    assert!(!game.is_valid_line(&long_v), "Should reject vertical line of length 2");

    // 5. Invalid: Diagonal (adjacent but diagonal)
    let diag = make_line(0, 0, 1, 1);
    // dr=1, dc=1. Sum is 2.
    assert!(!game.is_valid_line(&diag), "Should reject diagonal line");

    // 6. Invalid: Out of bounds
    let oob = make_line(3, 3, 3, 4); // 4 is out of bounds for index 0..3? No, size 4 means dots 0,1,2,3.
    // wait, grid_size 4 means 4x4 dots. Indices 0,1,2,3.
    // So 3,4 is invalid.
    assert!(!game.is_valid_line(&oob), "Should reject out of bounds");
}

#[test]
fn test_square_completion() {
    let mut game = create_test_game(3); // 3x3 dots, 2x2 boxes
    
    // Draw 3 sides of top-left square (0,0)
    // Top
    game.horizontal_lines.insert(make_line(0,0, 0,1));
    // Bottom
    game.horizontal_lines.insert(make_line(1,0, 1,1));
    // Left
    game.vertical_lines.insert(make_line(0,0, 1,0));
    
    // Now make the 4th move (Right side: 0,1 -> 1,1)
    let final_move = make_line(0,1, 1,1);
    
    // Before adding, it shouldn't be complete
    // We add to set implicitly inside logic? No, the logic checks existing lines + the current proposed line?
    // check_completed_squares logic:
    // It assumes the line is *conceptually* added.
    // BUT looking at my implementation:
    // `is_sq_complete` checks `self.horizontal_lines.contains`.
    // It does NOT check `line` arg.
    // So usually for `check_completed_squares` to work, the `line` must be IN the set OR we handle it specially.
    // My impl of `is_sq_complete` checks set membership only.
    // So I must add the line to the set BEFORE checking completion.
    
    game.vertical_lines.insert(final_move);
    let completed = game.check_completed_squares(&final_move);
    
    assert_eq!(completed.len(), 1, "Should complete exactly 1 square");
    assert_eq!(completed[0], "0,0", "Should be square 0,0");
}

#[test]
fn test_double_square_completion() {
    let mut game = create_test_game(3);
    
    // Setup two squares sharing a vertical edge
    // Square (0,0) and Square (0,1) share edge V(0,1)->(1,1)
    
    // Sq 0,0 needs: H(0,0-1), H(1,0-1), V(0,0-0), V(0,1-1)
    // Sq 0,1 needs: H(0,1-2), H(1,1-2), V(0,1-1), V(0,2-2)
    
    // Add all EXCEPT the shared vertical line
    game.horizontal_lines.insert(make_line(0,0, 0,1)); // Top 0,0
    game.horizontal_lines.insert(make_line(1,0, 1,1)); // Bot 0,0
    game.vertical_lines.insert(make_line(0,0, 1,0));   // Left 0,0
    
    game.horizontal_lines.insert(make_line(0,1, 0,2)); // Top 0,1
    game.horizontal_lines.insert(make_line(1,1, 1,2)); // Bot 0,1
    game.vertical_lines.insert(make_line(0,2, 1,2));   // Right 0,1
    
    // Validate setup: 0 squares done
    
    // Add shared line
    let shared = make_line(0,1, 1,1);
    game.vertical_lines.insert(shared);
    
    let completed = game.check_completed_squares(&shared);
    assert_eq!(completed.len(), 2, "Should complete 2 squares");
    assert!(completed.contains(&"0,0".to_string()));
    assert!(completed.contains(&"0,1".to_string()));
}
