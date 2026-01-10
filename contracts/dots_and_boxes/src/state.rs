use linera_sdk::{
    views::{MapView, RootView, ViewStorageContext},
    linera_base_types::{AccountOwner, CryptoHash},
};
use serde::{Deserialize, Serialize};
use crate::{Line, Dot, GameStatus};
use std::collections::{BTreeMap, BTreeSet};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct DotsAndBoxesState {
    pub games: MapView<CryptoHash, GameState>,
}

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct GameState {
    pub player1: AccountOwner,
    pub player1_chain_id: linera_sdk::linera_base_types::ChainId, // Added
    pub player2: Option<AccountOwner>, 
    pub player2_chain_id: Option<linera_sdk::linera_base_types::ChainId>, // Added
    pub current_turn: AccountOwner,
    pub grid_size: u8,
    pub horizontal_lines: BTreeSet<Line>, 
    pub vertical_lines: BTreeSet<Line>,
    pub squares: BTreeMap<String, AccountOwner>, // Key: "r,c", normalized
    pub status: GameStatus,
    pub scores: Vec<u8>, // [Player1, Player2]
    pub winner: Option<AccountOwner>,
}

impl GameState {
    pub fn is_valid_line(&self, line: &Line) -> bool {
        let s = line.start;
        let e = line.end;
        
        // Exact adjancency check
        let dr = (s.row as i16 - e.row as i16).abs();
        let dc = (s.col as i16 - e.col as i16).abs();
        if !((dr == 1 && dc == 0) || (dr == 0 && dc == 1)) {
            return false;
        }

        // Bounds check
        let size = self.grid_size;
        if s.row >= size || s.col >= size || e.row >= size || e.col >= size {
            return false;
        }
        
        true
    }

    pub fn check_completed_squares(&self, line: &Line) -> Vec<String> {
        let mut completed = Vec::new();
        let s = line.start;
        let e = line.end;
        let is_h = s.row == e.row;

        if is_h {
            // Horizontal [s, e]. normalization assumed or handled? 
            // The caller should normalize, but let's be safe or assume normalized.
            // Let's assume input line is NOT necessarily normalized, but line provided is the one JUST added.
            // Actually, for geometry checks, we need to know which side is which.
            // Let's normalize local copy.
            let (mut s, mut e) = (s, e);
            if s.col > e.col { std::mem::swap(&mut s, &mut e); }
            
            let r = s.row;
            let c = s.col; 

            // Check Above: Square (r-1, c)
            if r > 0 {
                // Top: H(r-1,c), Left: V(r-1,c), Right: V(r-1,c+1), Bottom: H(r,c)
                if self.is_sq_complete(r - 1, c) {
                    completed.push(format!("{},{}", r - 1, c));
                }
            }
            // Check Below: Square (r, c)
            if r < self.grid_size - 1 {
                if self.is_sq_complete(r, c) {
                    completed.push(format!("{},{}", r, c));
                }
            }
        } else {
             // Vertical. Normalize swap if needed (s.row < e.row)
             let (mut s, mut e) = (s, e);
             if s.row > e.row { std::mem::swap(&mut s, &mut e); }
             
             let r = s.row;
             let c = s.col;

             // Check Left: Square (r, c-1)
             if c > 0 {
                 if self.is_sq_complete(r, c - 1) {
                     completed.push(format!("{},{}", r, c - 1));
                 }
             }
             // Check Right: Square (r, c)
             if c < self.grid_size - 1 {
                 if self.is_sq_complete(r, c) {
                     completed.push(format!("{},{}", r, c));
                 }
             }
        }
        completed
    }

    fn is_sq_complete(&self, r: u8, c: u8) -> bool {
        // Need 4 lines normalized
        let top = self.norm_line(Dot{row:r,col:c}, Dot{row:r,col:c+1});
        let bot = self.norm_line(Dot{row:r+1,col:c}, Dot{row:r+1,col:c+1});
        let left = self.norm_line(Dot{row:r,col:c}, Dot{row:r+1,col:c});
        let right = self.norm_line(Dot{row:r,col:c+1}, Dot{row:r+1,col:c+1});

        self.horizontal_lines.contains(&top) &&
        self.horizontal_lines.contains(&bot) &&
        self.vertical_lines.contains(&left) &&
        self.vertical_lines.contains(&right)
    }

    fn norm_line(&self, mut s: Dot, mut e: Dot) -> Line {
        if s > e { std::mem::swap(&mut s, &mut e); }
        Line { start: s, end: e }
    }
}
