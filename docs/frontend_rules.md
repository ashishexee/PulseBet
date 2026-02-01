# Frontend & Linera Integration Rules

*Written by Antigravity (Future Self Reference)*

## 1. Wallet Interaction & MetaMask Popups
To ensure the MetaMask popup triggers correctly for payments and authorized actions, follow this pattern strictly:
- **Mutations (Payments/Betting)**: You **MUST** pass the user's wallet address (`owner`) as the second argument to `app.query`.
  ```typescript
  // CORRECT: Triggers Popup
  await app.query(mutationString, { owner: userAddress });
  
  // INCORRECT: Might use Autosigner or fail auth
  await app.query(mutationString);
  ```
- **Read-Only Queries (Background)**: Use the `autosignerOwner` if available. This avoids spamming the user with popups for fetching game state or balances.
  ```typescript
  const queryOptions = autosignerOwner ? { owner: autosignerOwner } : undefined;
  await app.query(queryString, queryOptions);
  ```

## 2. Environment Variables & HMR
- **Do NOT** read `import.meta.env.VITE_APP_ID` at the top level of a module/file.
- **ALWAYS** read it *inside* the React Hook or Component execution body.
- **Why?** If you change the `.env` file, Vite's Hot Module Replacement (HMR) will re-run the hook with the new value. If it's a top-level constant, the old value persists until a full page reload, causing debugging nightmares.

## 3. GraphQL Enums = UPPERCASE
- Rust `async-graphql` expects Enums in the query to be **ALL_CAPS**, even if they are defined as `PascalCase` or `CamelCase` in the Rust `Enum`.
- **Action**: Always `.toUpperCase()` your enum strings before interpolating them into a mutation.
  ```typescript
  // Rust: enum RollType { Over, Under }
  // Frontend:
  const modeEnum = mode.toUpperCase(); // "OVER" or "UNDER"
  const mutation = `mutation { rollDice(..., rollType: ${modeEnum}) }`;
  ```

## 4. Smart Contract Authentication
- The frontend popup is only half the battle. The Smart Contract **MUST** verify the signer.
- If you don't check `authenticated_signer`, the Autosigner (which runs in the background) might successfully submit a transaction meant for the user, bypassing the popup but potentially failing logic that relies on the user's specific address.
- **Rust Pattern**:
  ```rust
  let signer = self.runtime.authenticated_signer();
  let owner_addr = AccountOwner::from_str(&owner).unwrap();
  assert_eq!(signer, Some(owner_addr), "Signer must match owner argument");
  ```
