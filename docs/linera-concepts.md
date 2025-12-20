# Linera Concepts Explained

## 1. Local Network vs. Testnet vs. Mainnet

Think of these as different "universes" where your blockchain lives.

### 🏠 Local Network (`localhost`)
-   **What it is:** A tiny version of the Linera blockchain running **entirely on your computer**.
-   **Pros:** Ultra-fast, free, total control. You can restart it anytime.
-   **Cons:** **Ephemeral**. If you stop the `linera net up` command, **all data is deleted**. The "chain" stops existing.
-   **Use Case:** Development. When you are writing code and breaking things.

### 🌐 Testnet (`testnet`)
-   **What it is:** A shared network run by the Linera team or community.
-   **Pros:** Persistent (data stays for a while), accessible by others (you can send links to friends).
-   **Cons:** Slower than local, tokens are "fake" / worthless.
-   **Use Case:** Staging. Testing your app before going live.

---

## 2. The Checko Wallet

-   **What it is:** A browser extension (like MetaMask) that manages your **Identity** (Private Keys) and your **Microchains**.
-   **What it does:**
    1.  **Signs Transactions:** Proves it's "you" sending the message.
    2.  **Manages Connections:** Connects your browser to the Blockchain (either Local or Testnet).

---

## 3. The "Invalid Microchain" Error (And why it happens)

This is the most important part to understand about Linera.

### The "Microchain" Concept
In Linera, **every user has their own mini-blockchain** (a "microchain").
-   When you create a wallet, you claim a specific "Chain ID" on the network.
-   The network tracks your chain: "User Alice owns Chain ID `12345`".

### Why the Error Happened
1.  **You had a Local Network running.**
2.  **You connected Checko:** Checko asked the network for a chain and got Chain ID `A`. Checko saved this: "I own Chain A on Localhost".
3.  **You restarted your Local Network:** You stopped and started `linera net up`.
    -   Because it's a **Local Network**, the "Universe" was destroyed and recreated.
    -   In the new Universe, **Chain A does not exist**. It was wiped out.
4.  **Checko tried to connect:** Checko still remembers "I own Chain A". It tries to talk to the new network about Chain A.
5.  **The Network replies:** "Invalid Microchain. I've never heard of Chain A."

### How to Fix It
Because your local network was reset, your wallet's memory is outdated.
1.  **Reset the Wallet Account:** Go to Checko Settings -> Advanced -> Reset Account / Clear Activity. This tells Checko to forget about Chain A.
2.  **Reconnect:** Checko will ask the new network for a *new* chain (Chain B), and everything will work again.
