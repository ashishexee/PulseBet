# PulseBet 🎲

**PulseBet** is the first real-time, provably fair betting platform built on the **Linera Layer-1** microchain protocol. It leverages Linera's multi-chain architecture to offer instant finality, practically zero latency, and transparent gaming logic.

## 🚀 Features

- **Microchain Architecture**: Every player interacts with their own chain or the application chain, ensuring infinite scalability.
- **Instant Finality**: Games are settled in real-time. No waiting for block confirmations.
- **Provably Fair**: All game logic is executed on-chain via WebAssembly (Wasm) smart contracts.
- **PulseToken ($PT)**: The native utility token for wagering and rewards.
- **Wallet Integration**: Seamless connection via MetaMask (with Linera Signer adaptation).

## 🕹️ Live Protocols

### 1. Mines 💣
Navigate a hidden entropy field. Adjust your risk by choosing the number of mines. Cash out anytime or push your luck for higher multipliers.
- **Contract Type**: `mines`
- **Application ID**: `ad533a6a0b76a32063870b2c5aa3d7b0b2ad90238e49b12e0b50a2c8ce2a866a`

### 2. Memory Protocol 🧠
A test of cognitive recall. Match pairs of cards on the blockchain. 
- **Contract Type**: `memory_game`
- **Application ID**: `29ef89026ec56395492ba6fa3b95c1f6d76e46815a3c2110b282d219cfaebd60`

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Blockchain**: Linera Protocol (Rust, Wasm)
- **SDK**: `@linera/client`
- **Deployment**: Vercel

## ⚙️ Configuration (.env)

Ensure your `frontend/.env` file is configured with the following active testnet Application IDs:

```env
# Linera Node & Chain
VITE_LINERA_NODE_URL=https://testnet-conway.linera.net
VITE_LINERA_CHAIN_ID=bee61fb9c9f6284b02609d6748d7c4423a0e191ff39018fc9e530b00b8134204

# Core Contracts
VITE_PULSE_TOKEN_APP_ID=8e7498a4564d33c50bc4a3053eba7b51a4f5e7085111dbcc7cd3efe6072a7961
VITE_MINES_APP_ID=ad533a6a0b76a32063870b2c5aa3d7b0b2ad90238e49b12e0b50a2c8ce2a866a
VITE_MEMORY_GAME_APP_ID=29ef89026ec56395492ba6fa3b95c1f6d76e46815a3c2110b282d219cfaebd60
```

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pulsebet.git
   cd pulsebet
   ```

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173`

## 🚢 Deployment

The frontend is optimized for **Vercel** deployment.
- **Configuration**: `vercel.json` handles cross-origin headers (COOP/COEP) required for Linera Wasm threads.
- **Rewrites**: Proxy configured for `/faucet-proxy` to handle testnet funding.

```json
/* vercel.json snippet */
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
      { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
    ]
  }
]
```

## 📜 License
This project is part of the Linera Akindo Wavehack.
