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

    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>) => {
        if (!client || !chainId || !APP_ID) {
            console.log("executeQuery early return:", { client: !!client, chainId, APP_ID });
            return null;
        }
        console.log("executeQuery called:", { APP_ID, chainId, hasClient: !!client });
        try {
            console.log("executeQuery chain:", { chainId });
            const chain = await client.chain(chainId);
            console.log('Got Chain:', chain);
            console.log('Getting ApplicationID: ', APP_ID);
            const app = await chain.application(APP_ID);
            console.log('Got application Id', app);
            let formattedQuery = query;
            if (variables) {
                Object.entries(variables).forEach(([key, value]) => {
                    formattedQuery = formattedQuery.replace(`$${key}`, JSON.stringify(value));
                });
            }
            const requestBody = JSON.stringify({ query: formattedQuery });
            console.log("Sending query:", requestBody);

            const responseJson = await app.query(requestBody);
            console.log("Raw response:", responseJson);
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
