import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export interface KenoGameState {
    owner: string;
    betAmount: string;
    picks: number[];
    drawnNumbers: number[];
    hits: number;
    payout: string;
    multiplier: number;
    timestamp: number;
}

export const useKenoGame = () => {
    const { client, chainId, isConnected, owner, autosignerOwner } = useLineraWallet();
    const [gameState, setGameState] = useState<KenoGameState | null>(null);
    const [loading, setLoading] = useState(false);

    const APP_ID = import.meta.env.VITE_KENO_APP_ID;

    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>) => {
        if (!client || !chainId || !APP_ID) return null;
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
            const queryOptions = autosignerOwner ? { owner: autosignerOwner } : undefined;
            const responseJson = await app.query(requestBody, queryOptions);
            const response = JSON.parse(responseJson);
            return response.data;
        } catch (e) {
            console.error("GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, APP_ID, autosignerOwner]);

    const refreshState = useCallback(async () => {
        if (!isConnected || !owner) return;
        const FETCH_LAST_GAME = `{
            lastGame(owner: "${owner}") {
                owner
                betAmount
                picks
                drawnNumbers
                hits
                payout
                multiplier
                timestamp
            }
        }`;

        try {
            const data = await executeQuery(FETCH_LAST_GAME);
            if (data?.lastGame) {
                setGameState({
                    owner: data.lastGame.owner,
                    betAmount: data.lastGame.betAmount,
                    picks: data.lastGame.picks,
                    drawnNumbers: data.lastGame.drawnNumbers,
                    hits: data.lastGame.hits,
                    payout: data.lastGame.payout,
                    multiplier: data.lastGame.multiplier,
                    timestamp: data.lastGame.timestamp
                });
            }
        } catch (e) {
            // console.error(e);
        }
    }, [isConnected, executeQuery, owner]);

    const playKeno = async (amount: number, picks: number[]) => {
        console.log("[Keno] playKeno called", { amount, picks, owner, APP_ID, isConnected });

        if (!owner) {
            console.error("[Keno] Wallet not connected");
            throw new Error("Wallet not connected");
        }
        if (!APP_ID) {
            console.error("[Keno] APP_ID missing");
            throw new Error("Keno App ID not configured");
        }

        setLoading(true);
        const picksString = JSON.stringify(picks);
        const amountInt = Math.floor(amount);
        console.log("[Keno] Casting amount to integer for u64:", amountInt);

        const mutation = `mutation {
            playKeno(betAmount: ${amountInt}, picks: ${picksString}, owner: "${owner}")
        }`;

        console.log("[Keno] Mutation:", mutation);

        try {
            if (!client || !chainId) throw new Error("Linera client not ready");

            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);

            const requestBody = JSON.stringify({ query: mutation });
            console.log("[Keno] Sending query with owner:", owner);

            const result = await app.query(requestBody, { owner });
            console.log("[Keno] Query Result:", result);

            await refreshState();
        } catch (e) {
            console.error("[Keno] Play failed with error:", e);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            refreshState();
            const interval = setInterval(refreshState, 5000);
            return () => clearInterval(interval);
        }
    }, [isConnected, refreshState]);

    return {
        gameState,
        loading,
        playKeno,
        refreshState
    };
};
