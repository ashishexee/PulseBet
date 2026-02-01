use linera_sdk::{
    linera_base_types::ApplicationId,
    views::{MapView, RegisterView, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Game {
    pub owner: String,
    pub bet_amount: u64,
    pub picks: Vec<u8>,
    pub drawn_numbers: Vec<u8>,
    pub hits: u8,
    pub payout: u64,
    pub multiplier: u64,
    pub timestamp: u64,
}

#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct KenoState {
    pub nonce: RegisterView<u64>,
    pub pulse_token_id: RegisterView<Option<ApplicationId>>,
    pub active_games: MapView<String, Game>,
}

#[allow(dead_code)]
pub struct PayoutTable;

#[allow(dead_code)]
impl PayoutTable {
    // Multipliers are scaled by 100 (e.g., 200 = 2.0x, 50 = 0.5x, 0 = 0x)
    // Indexes: [picks_count][hits_count]
    // Note: picks_count 0 is impossible, so row 0 is dummy.
    pub fn get_multiplier(picks: usize, hits: usize) -> u64 {
        match picks {
            1 => match hits {
                1 => 380, // 1/40 chance roughly x house edge? 3.8x
                _ => 0,
            },
            2 => match hits {
                2 => 1400, // 14x
                _ => 0,
            },
            3 => match hits {
                3 => 4500, // 45x
                2 => 100,  // 1x
                _ => 0,
            },
            4 => match hits {
                4 => 8000,
                3 => 400,
                2 => 50, // 0.5x (money back half)
                _ => 0,
            },
            5 => match hits {
                5 => 25000, // 250x
                4 => 1500,
                3 => 200,
                _ => 0,
            },
            6 => match hits {
                6 => 50000,
                5 => 3000,
                4 => 300,
                3 => 50,
                _ => 0,
            },
            7 => match hits {
                7 => 100000,
                6 => 10000,
                5 => 1200,
                4 => 100,
                _ => 0,
            },
            8 => match hits {
                8 => 200000, // 2000x
                7 => 25000,
                6 => 5000,
                5 => 400,
                _ => 0,
            },
            9 => match hits {
                9 => 500000, // 5000x
                8 => 100000,
                7 => 8000,
                6 => 600,
                4 => 50,
                _ => 0,
            },
            10 => match hits {
                10 => 1000000, // 10,000x Jackpot
                9 => 200000,
                8 => 20000,
                7 => 2000,
                6 => 200,
                5 => 50,
                0 => 100, // Fun feature: 10 picks, 0 hits = money back
                _ => 0,
            },
            _ => 0,
        }
    }

    pub fn get_max_multiplier(picks: usize) -> u64 {
        // Just return the top prize for that pick count
        match picks {
            1 => 380,
            2 => 1400,
            3 => 4500,
            4 => 8000,
            5 => 25000,
            6 => 50000,
            7 => 100000,
            8 => 200000,
            9 => 500000,
            10 => 1000000,
            _ => 0,
        }
    }
}
