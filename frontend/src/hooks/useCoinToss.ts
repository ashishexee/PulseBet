import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export interface GameLog {
    owner: string;
    betAmount: string;
    prediction: number;
    result: number;
    payout: string;
    won: boolean;
}

export const useCoinToss = () => {
    const { client, chainId, isConnected, owner } = useLineraWallet();
    const [lastGame, setLastGame] = useState<GameLog | null>(null);
    const [loading, setLoading] = useState(false);
    const APP_ID = import.meta.env.VITE_COIN_TOSS_APP_ID;

    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>, options?: any) => {
        if (!client || !chainId || !APP_ID) {
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
            const responseJson = await app.query(requestBody, options);
            const response = JSON.parse(responseJson);
            return response.data;
        } catch (e) {
            console.error("GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, APP_ID]);

    const refreshState = useCallback(async () => {
        if (!isConnected) return;
        const FETCH_LAST_GAME = `{
            lastGame {
                owner
                betAmount
                prediction
                result
                payout
                won
            }
        }`;

        try {
            const data = await executeQuery(FETCH_LAST_GAME);
            if (data?.lastGame) {
                setLastGame({
                    owner: data.lastGame.owner,
                    betAmount: data.lastGame.betAmount,
                    prediction: data.lastGame.prediction,
                    result: data.lastGame.result,
                    payout: data.lastGame.payout,
                    won: data.lastGame.won
                });
            }
        } catch (e) {
            // console.error(e);
        }
    }, [isConnected, executeQuery]);

    const playToss = async (amount: number, prediction: 'HEADS' | 'TAILS') => {
        console.log("playToss called with:", { amount, prediction });

        if (!owner) {
            console.error("playToss failed: Wallet not connected (owner is null)");
            throw new Error("Wallet not connected");
        }
        if (!APP_ID) {
            console.error("playToss failed: VITE_COIN_TOSS_APP_ID is missing");
            throw new Error("Coin Toss App ID not configured");
        }
        if (!client || !chainId) {
            console.error("playToss failed: Client or ChainID missing", { client: !!client, chainId });
            return;
        }

        console.log("playToss context:", { owner, APP_ID, chainId });

        setLoading(true);
        // prediction is Enum in Rust: Heads, Tails (Uppercase for GraphQL)
        const mutation = `mutation {
            playToss(amount: ${amount}, prediction: ${prediction}, owner: "${owner}")
        }`;
        console.log("playToss mutation:", mutation);

        try {
            console.log("Fetching chain and app...");
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);

            const requestBody = JSON.stringify({ query: mutation });
            console.log("Sending query options:", { owner });

            // IMPORTANT: Passing { owner } as second arg triggers the wallet popup
            const result = await app.query(requestBody, { owner });
            console.log("playToss result:", result);

            await refreshState();
        } catch (e) {
            console.error("Bet failed:", e);
            throw e;
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
        lastGame,
        loading,
        playToss,
        refreshState
    };
};
