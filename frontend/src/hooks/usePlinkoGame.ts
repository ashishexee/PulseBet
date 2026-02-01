import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

// Define the shape of our Game State from the contract
interface PlinkoGame {
    owner: string;
    betAmount: number;
    currentRow: number;
    currentCol: number;
    path: Direction[];
    result: 'WON' | 'LOST' | 'ACTIVE';
    finalMultiplier: number;
}

export type Direction = 'Left' | 'Right';

export const usePlinkoGame = () => {
    const { client, chainId, isConnected, owner, autosignerOwner } = useLineraWallet();
    const [gameState, setGameState] = useState<PlinkoGame | null>(null);
    const [loading, setLoading] = useState(false);

    // TODO: User needs to add this to .env (VITE_PLINKO_APP_ID)
    const APP_ID = import.meta.env.VITE_PLINKO_APP_ID;

    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>) => {
        if (!client || !chainId || !APP_ID) {
            // console.log("executeQuery early return:", { client: !!client, chainId, APP_ID });
            return null;
        }
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);

            let formattedQuery = query;
            if (variables) {
                Object.entries(variables).forEach(([key, value]) => {
                    formattedQuery = formattedQuery.replace(`$${key}`, JSON.stringify(value));
                });
            }
            const requestBody = JSON.stringify({ query: formattedQuery });

            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);
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
                betAmount
                currentRow
                currentCol
                path
                result
                finalMultiplier
            }
        }`;

        try {
            const data = await executeQuery(FETCH_GAME_STATE);
            if (data?.activeGame) {
                setGameState(data.activeGame);
            } else {
                setGameState(null);
            }
        } catch (e) {
            // console.error(e);
        }
    }, [isConnected, executeQuery]);

    // Mutations
    const startGame = async (amount: number) => {
        if (!owner || !APP_ID) return;
        setLoading(true);
        // Contract expects u64, ensure integer
        const mutation = `mutation {
            startGame(amount: ${Math.floor(amount)}, owner: "${owner}")
        }`;
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner });
            await refreshState();
        } catch (e) {
            console.error("Start failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const advanceBatch = async (targetRow: number) => {
        if (!APP_ID || !autosignerOwner) return;
        const mutation = `mutation {
            advanceBatch(targetRow: ${targetRow})
        }`;
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            await refreshState();
        } catch (e) {
            console.error("Advance failed:", e);
        }
        // setLoading(false);
    };

    // Poll for updates
    useEffect(() => {
        const interval = setInterval(refreshState, 1000);
        return () => clearInterval(interval);
    }, [refreshState]);

    return {
        gameState,
        loading,
        startGame,
        advanceBatch,
        refreshState
    };
};
