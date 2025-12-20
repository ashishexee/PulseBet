import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export interface GameState {
    owner: string;
    minesCount: number;
    betAmount: string;
    revealedTiles: number[];
    mineIndices: number[];
    result: 'ACTIVE' | 'WON' | 'LOST' | 'CASHED_OUT';
    currentMultiplier: number;
}

export const useMinesGame = () => {
    const { client, chainId, isConnected, owner } = useLineraWallet();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(false);

    const APP_ID = import.meta.env.VITE_MINES_APP_ID;

    // Helper to execute GraphQL on the application
    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>) => {
        if (!client || !chainId || !APP_ID) {
            console.log("executeQuery early return:", { client: !!client, chainId, APP_ID });
            return null;
        }
        console.log("executeQuery called:", { APP_ID, chainId, hasClient: !!client });
        try {
            // 1. Get Chain
            console.log("executeQuery chain:", { chainId });
            const chain = await client.chain(chainId);
            console.log('Got Chain:', chain);
            console.log('Getting ApplicationID: ', APP_ID);
            // 2. Get Application
            const app = await chain.application(APP_ID);
            console.log('Got application Id', app);
            // 3. Execute Query (The SDK expects raw query string, maybe with variables interpolated or passed?)
            // The d.ts `query(query: string, options?: QueryOptions | null): Promise<string>;` suggests raw string.
            // We might need to handle variables manually or JSON.stringify(variables).
            // Actually, usually GraphQL over this interface requires constructing the string with values inline 
            // OR the SDK supports variables. The d.ts didn't explicitly show separate variables arg.
            // Let's assume we need to format the query. Simple string replacement for now.

            // Simplified variable injection (risky if strings, but here mostly Ints)
            let formattedQuery = query;
            if (variables) {
                Object.entries(variables).forEach(([key, value]) => {
                    // This is a naive replace, ideally we use a library or proper vars if SDK supports
                    formattedQuery = formattedQuery.replace(`$${key}`, JSON.stringify(value));
                    // Also strip the declaration variables specific syntax if needed, 
                    // but usually keeping `query Name(...)` fails if variables aren't passed.
                    // For the Linera Wasm client, queries are often just the selection set if it's Rust `async-graphql`.
                    // But if it's full GraphQL, we need to be careful.
                    // Let's try sending the `Operation` struct as JSON if that's what the contract expects?
                    // Wait, the `contract.rs` uses `async-graphql`. 
                    // The SDK `query` method returns a `Promise<string>` which is the JSON response.
                });
            }

            // For now, let's keep the query structure simple or use a lightweight formatter if needed.
            // Actually, if we look at `contract.rs` (which I viewed earlier), it uses `async-graphql`.
            // The service likely exposes a full schema.
            // The SDK `app.query` sends the string to the service.

            // async-graphql expects: {"query": "..."} not just the raw query string
            const requestBody = JSON.stringify({ query: formattedQuery });
            console.log("Sending query:", requestBody);

            const responseJson = await app.query(requestBody);
            console.log("Raw response:", responseJson);
            // The d.ts signature: query(query: string, options?: QueryOptions): Promise<string>
            // No variables arg. We likely have to embed variables or use a different method.
            // Or `query` is just the JSON body?

            // NOTE: Since I can't be 100% sure of variable support, 
            // I will use simple template literal construction for the mutations below 
            // instead of named variables in the query string.

            const response = JSON.parse(responseJson);
            console.log("Parsed response:", response);
            return response.data;
        } catch (e) {
            console.error("GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, APP_ID]);

    const refreshState = useCallback(async () => {
        if (!isConnected) return;
        const FETCH_GAME_STATE = `{
            activeGame {
                owner
                minesCount
                betAmount
                revealedTiles
                mineIndices
                result
                currentMultiplier
            }
        }`;

        try {
            const data = await executeQuery(FETCH_GAME_STATE);
            if (data?.activeGame) {
                setGameState({
                    owner: data.activeGame.owner,
                    minesCount: data.activeGame.minesCount,
                    betAmount: data.activeGame.betAmount,
                    revealedTiles: data.activeGame.revealedTiles,
                    mineIndices: data.activeGame.mineIndices || [],
                    result: data.activeGame.result,
                    currentMultiplier: data.activeGame.currentMultiplier
                });
            } else {
                setGameState(null);
            }
        } catch (e) {
            // console.error(e);
        }
    }, [isConnected, executeQuery, client, chainId]);

    // Mutations - constructing raw strings since `variables` arg is missing in SDK
    const startGame = async (amount: number, mines: number) => {
        if (!owner) {
            console.error("Bet failed: Wallet not connected, owner is null");
            throw new Error("Wallet not connected");
        }
        if (!APP_ID) {
            console.error("Bet failed: VITE_MINES_APP_ID not set");
            throw new Error("Mines App ID not configured");
        }
        console.log("Starting bet:", { amount, mines, owner, APP_ID });
        setLoading(true);
        const mutation = `mutation {
            bet(amount: ${amount}, minesCount: ${mines}, owner: "${owner}")
        }`;
        console.log("Bet mutation:", mutation);
        try {
            const result = await executeQuery(mutation);
            console.log("Bet result:", result);
            await refreshState();
        } catch (e) {
            console.error("Bet failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const revealTile = async (tileId: number) => {
        setLoading(true);
        const mutation = `mutation {
            reveal(tileId: ${tileId})
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } catch (e) {
            // console.error("Reveal failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const cashOut = async () => {
        setLoading(true);
        // Fixed: Use snake_case mutation name to match contract
        const mutation = `mutation {
            cashOut
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } catch (e) {
            // console.error("Cashout failed:", e);
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates
    useEffect(() => {
        const interval = setInterval(refreshState, 2000);
        return () => clearInterval(interval);
    }, [refreshState]);

    return {
        gameState,
        loading,
        startGame,
        revealTile,
        cashOut,
        refreshState
    };
};
