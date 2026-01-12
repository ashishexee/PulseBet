# PulseBet: Linera Hackathon Documentation

<img src="../assets/banner/banner.png" width="100%" alt="PulseBet Banner" />

## 🎯 Executive Summary

**PulseBet** is a groundbreaking real-time gaming platform built entirely on the **Linera Layer-1 microchain protocol**. This hackathon submission demonstrates the power of Linera's architecture through multiple game implementations, showcasing both **single-player cross-application calls** and **multiplayer cross-chain messaging**.

Our journey began with single-player games like Mines and Memory, then evolved to implement **successful cross-chain multiplayer experiences** in DotsAndBoxes and Bingo, proving Linera's capability to handle complex, real-time interactions across multiple microchains.

---

## 🏗️ System Architecture

### High-Level Overview
![System architecture](/assets/banner/ss/system_architecture.png)


### Key Architectural Principles

1. **Microchain Per Player**: Each user connects via their wallet and is assigned their own Linera microchain, ensuring infinite horizontal scalability.

2. **Instant Finality**: All state transitions are immediately finalized with zero block confirmation delays.

3. **Cross-Application Communication**: Games interact with the PulseToken contract for betting/rewards via synchronous cross-application calls.

4. **Cross-Chain Messaging**: Multiplayer games coordinate state across player chains using Linera's asynchronous messaging system.

---

## 🔗 Linera Integration Deep Dive

### 1. Single-Player Architecture (Cross-Application Calls)

Games like **Mines**, **Memory Game**, and **Color Trading** operate on a single chain but interact with the PulseToken contract for financial operations.

#### How It Works:

![Single player architecture](/assets/banner/ss/single_player.png)

#### Code Example (Mines Contract):

```rust
// Cross-application call to debit tokens
let token_app_id = pulse_token_id.with_abi::<pulse_token::PulseTokenAbi>();

let debit_op = pulse_token::Operation::GameDebit {
    owner: account_owner,
    amount: Amount::from_tokens(bet_amount.into()),
};

self.runtime.call_application(true, token_app_id, &debit_op);
```

**Key Linera Features Used:**
- ✅ `ContractRuntime::call_application()` for synchronous cross-contract calls
- ✅ `RootView` and `View` traits for persistent state management
- ✅ On-chain randomness via `CryptoHash` deterministic generation

---

### 2. Multiplayer Cross-Chain Architecture

**DotsAndBoxes** and **Bingo** implement true cross-chain gaming where each player operates on their own microchain, coordinating game state via messages.

#### How It Works:

![Multiplayer architecture](/assets/banner/ss/multiplayer_flow.png)

#### Code Example (DotsAndBoxes Contract):

**Sending Cross-Chain Messages:**
```rust
// Player sends move to host chain
let message = Message::MakeMove { game_id, line, player };
self.runtime.send_message(host_chain_id, message);
```

**Receiving Cross-Chain Messages:**
```rust
async fn execute_message(&mut self, message: Message) {
    match message {
        Message::JoinGame { game_id, player, player_chain_id } => {
            self.do_join_game(game_id, player, player_chain_id).await;
            self.sync_state(game_id).await; // Broadcast to all players
        },
        Message::MakeMove { game_id, line, player } => {
            self.do_make_move(game_id, line, player).await;
            self.sync_state(game_id).await;
        },
        Message::SyncState { game_id, state } => {
            // Update local copy of game state
            self.state.games.insert(&game_id, state)?;
        }
    }
}
```

**State Synchronization:**
```rust
async fn sync_state(&mut self, game_id: CryptoHash) {
    let game = self.state.games.get(&game_id).await?.unwrap();
    let message = Message::SyncState { game_id, state: game.clone() };
    
    // Send to both players' chains
    self.runtime.send_message(game.player1_chain_id, message.clone());
    if let Some(p2_chain) = game.player2_chain_id {
        self.runtime.send_message(p2_chain, message);
    }
}
```

**Key Linera Features Used:**
- ✅ `ContractRuntime::send_message()` for asynchronous cross-chain communication
- ✅ `execute_message()` handler for processing incoming messages
- ✅ `ChainId` tracking for routing messages to correct player chains
- ✅ State replication pattern for synchronized multiplayer experiences

---

### 3. Advanced: Event Streaming (Bingo)

The **Bingo** game uses Linera's **event streaming** feature for real-time notifications across multiple players.

#### Architecture:

```rust
// Host emits events to a named stream
self.runtime.emit(
    StreamName::from(format!("game_events_{}", room.room_id)),
    &BingoEvent::PlayerJoined { player_name, timestamp }
);

// Players subscribe to the host's event stream
fn subscribe_to_host(&mut self, host_chain_id: ChainId, room_id: &str) {
    let stream = StreamName::from(format!("game_events_{}", room_id));
    self.runtime.subscribe_to_events(host_chain_id, app_id, stream);
}
```

**Benefits:**
- Players automatically receive game updates without polling
- Decouples event notification from state synchronization
- Enables spectator modes and real-time leaderboards

---

## 🎮 Game Implementations

### Game 1: Mines 💣

**Type:** Single-Player  
**Linera Features:** Cross-Application Calls, On-Chain Randomness

#### Game Flow Architecture

![Mines architecture](/assets/banner/ss/mines.png)

#### Key Implementation Details

- **Random Mine Generation:** Uses `CryptoHash::new()` with chain_id + timestamp + nonce
- **Multiplier Logic:** Progressive rewards based on revealed safe tiles and mine count
- **State Machine:** `Active` → `Lost` / `Won` / `CashedOut`

---

### Game 2: Memory Game 🧠

**Type:** Single-Player  
**Linera Features:** Cross-Application Calls, Deterministic Shuffling

#### Game Flow Architecture
![Memory architecture](/assets/banner/ss/memory.png)
#### Key Implementation Details

- **Card Shuffling:** Deterministic but unpredictable using chain context
- **Turn-Based Scoring:** Incentivizes faster completion
- **Two-Click Pattern:** First click stores card, second click checks match

---

### Game 3: Dots and Boxes 📦

**Type:** Multiplayer (2 Players)  
**Linera Features:** Cross-Chain Messaging, State Synchronization

#### Cross-Chain Architecture
![Dots and boxes architecture](/assets/banner/ss/dots_and_boxes.png)

#### Key Implementation Details

- **Host-Authority Model:** Player 1's chain is the source of truth
- **Message Types:**
  - `JoinGame` - Player 2 requests to join
  - `MakeMove` - Any player sends their move to host
  - `SyncState` - Host broadcasts updated game state to both players
- **Turn Validation:** Host verifies it's the correct player's turn before applying moves
- **Extra Turn Rule:** Completing a square grants another turn
- **State Replication:** Every move triggers state sync to keep both chains aligned

---

### Game 4: Bingo 🎯

**Type:** Multiplayer (2+ Players)  
**Linera Features:** Cross-Chain Messaging, Event Streaming, Turn-Based Coordination

#### Cross-Chain Event Streaming Architecture
![Bingo architecture](/assets/banner/ss/bingo.png)  

#### Key Implementation Details

- **Event-Driven Architecture:** Uses `StreamName` for real-time updates
  - `game_events_{room_id}` stream for all game events
  - Events: `PlayerJoined`, `GameStarted`, `NumberPicked`, `PlayerLeft`, `GameEnded`
- **Board Generation:** Each player gets a unique 5×5 board with randomized numbers
- **Turn Management:** Rotates through `current_turn_index`
- **Win Condition:** First player to complete 2 or more lines (rows, columns, or diagonals)
- **Subscription Model:**
  - Host creates event stream
  - Players subscribe when joining
  - Unsubscribe when leaving

---

### Game 5: Color Trading 🌈

**Type:** Single-Player Prediction Market  
**Linera Features:** Cross-Application Calls, Time-Based State Transitions

#### Time-Based State Machine Architecture

![Color Trading architecture](/assets/banner/ss/color_trading.png)

#### Key Implementation Details

- **Round Lifecycle:** `Betting` (40s) → `Revealing` → `Cooldown` (10s) → New Round
- **Probability-Based RNG:**
  ```rust
  let random_val = hash.as_bytes()[0] % 100;
  // A(30%): 0-29, B(30%): 30-59, C(15%): 60-74, etc.
  ```
- **Multiplier System:** Higher risk (lower probability) = higher reward
- **Batch Payouts:** All winners in a round are paid out in a single `Reveal` operation

---

### Game 6: Wordle 📝

**Type:** Single-Player Word Puzzle  
**Linera Features:** On-Chain Word Validation, State Machine

*(Brief overview - similar single-player pattern to Mines/Memory)*

- Daily word challenge stored on-chain
- 6 attempts to guess 5-letter word
- Color-coded feedback (Green/Yellow/Gray) for letter positions
- No betting, pure entertainment or leaderboard-based rewards

---

## 📊 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Linera Protocol (Rust + WebAssembly) |
| **Smart Contracts** | Rust with `linera-sdk` |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | TailwindCSS |
| **Blockchain SDK** | `@linera/client` |
| **State Management** | React Context + Custom Hooks |
| **Deployment** | Vercel (with COOP/COEP headers for Wasm threads) |

---

## 🚀 Deployment & Configuration

### Environment Variables

```env
VITE_LINERA_NODE_URL=https://testnet-conway.linera.net
VITE_LINERA_CHAIN_ID=bee61fb9c9f6284b02609d6748d7c4423a0e191ff39018fc9e530b00b8134204

VITE_PULSE_TOKEN_APP_ID=8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961
VITE_MINES_APP_ID=ad533a6a0b76a32063870b2c5aa3d7b0b2ad90238e49b12e0b50a2c8ce2a866a
VITE_MEMORY_GAME_APP_ID=29ef89026ec56395492ba6fa3b95c1f6d76e46815a3c2110b282d219cfaebd60
```

### Vercel Configuration

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

These headers enable **SharedArrayBuffer** support required for Linera's multi-threaded Wasm execution.

---

## 🎓 Key Learnings & Achievements

### ✅ Successfully Implemented Cross-Chain Gaming

The evolution from single-player to multiplayer cross-chain games demonstrates Linera's:
- **Message reliability**: No lost moves or state desynchronization observed
- **Low latency**: Cross-chain messages settle in ~1-2 seconds on testnet
- **Developer ergonomics**: Clean APIs for `send_message()` and `execute_message()`

### ✅ State Synchronization Pattern

Developed a robust pattern for multiplayer games:
1. Host chain maintains authoritative state
2. Player actions sent as messages to host
3. Host validates, applies, and broadcasts updated state
4. All chains maintain local copies for instant UI updates

### ✅ Cross-Application Composability

PulseToken serves as a shared financial layer across all games, showcasing:
- Contract-to-contract calls within the same blockchain
- Atomic debit/credit operations for secure betting
- Reusable token infrastructure

---

## 🔮 Future Enhancements

1. **Tournament System**: Multi-round competitions with prize pools
2. **Spectator Mode**: Non-player chains subscribing to game events
3. **NFT Rewards**: Linera-native NFTs for achievements
4. **Advanced RNG**: Integration with VRF (Verifiable Random Functions)
5. **Mobile App**: React Native with Linera SDK integration

---

## 📜 Contract Addresses

| Application | App ID |
|------------|--------|
| **PulseToken** | `8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961` |
| **Mines** | `ad533a6a0b76a32063870b2c5aa3d7b0b2ad90238e49b12e0b50a2c8ce2a866a` |
| **Memory Game** | `29ef89026ec56395492ba6fa3b95c1f6d76e46815a3c2110b282d219cfaebd60` |
| **DotsAndBoxes** | `4f7b879e8de4ae9904e6d0f467f759fac95652bfbebc2cb74ffbfef7c0fbb14c` |
| **Bingo** | `6cc2d07934474f05b4eae5e7363f8bf07f53d04e0d87ce081addf75c8eacdc28`|
| **Color Trading** | `f676e496412cf108baefac15b6667aded48f66d5ff4944b86562a5a65b3373d2` |
| **Wordle** | `69880b862a20dd4fd6293a5bfdec06cabffbfc58c9a6071d3fb17d8bddb3c832` |

---

## 👥 Team & Acknowledgments

Built with ❤️ for the **Linera Akindo Wavehack**

Special thanks to the Linera team for:
- Comprehensive SDK documentation
- Responsive testnet infrastructure
- Innovative microchain architecture that makes this possible

---

## 📄 License

This project is part of the Linera Akindo Wavehack hackathon submission.

---

**Live Demo:** [PulseBet on Vercel](https://pulsebet-blond.vercel.app/)  
**Repository:** [GitHub Link](https://github.com/ashishexee/PulseBet) 

---

*Built on Linera. Powered by Microchains. Delivering Real-Time Gaming.*
