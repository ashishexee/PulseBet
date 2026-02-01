import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';
import { usePulseToken } from './usePulseToken';

export interface DiceGameState {
    owner: string;
    betAmount: string;
    target: number;
    resultRoll: number;
    payout: string;
    multiplier: number;
}

export const useDiceGame = () => {
    const { client, chainId, owner, autosignerOwner, isConnected } = useLineraWallet();
    const [loading, setLoading] = useState(false);
    const [lastGame, setLastGame] = useState<DiceGameState | null>(null);
    const { refreshBalance } = usePulseToken();

    // Move env read INSIDE hook to ensure fresh value on re-renders/HMR
    const DICE_APP_ID = import.meta.env.VITE_DICE_APP_ID;

    const executeQuery = useCallback(async (query: string, variables?: Record<string, any>) => {
        if (!client || !chainId || !DICE_APP_ID) {
            return null;
        }
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(DICE_APP_ID);

            let formattedQuery = query;
            if (variables) {
                Object.entries(variables).forEach(([key, value]) => {
                    formattedQuery = formattedQuery.replace(`$${key}`, JSON.stringify(value));
                });
            }
            const requestBody = JSON.stringify({ query: formattedQuery });

            // Use autosigner if available for read-only queries
            const queryOptions = autosignerOwner ? { owner: autosignerOwner } : undefined;
            const responseJson = await app.query(requestBody, queryOptions);
            const response = JSON.parse(responseJson);
            return response.data;
        } catch (e) {
            console.error("[Dice] GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, DICE_APP_ID, autosignerOwner]);

    const fetchState = useCallback(async () => {
        if (!isConnected) return;
        const FETCH_GAME_STATE = `{
            activeGame {
                owner
                betAmount
                target
                resultRoll
                payout
                multiplier
            }
        }`;

        try {
            const data = await executeQuery(FETCH_GAME_STATE);
            if (data && data.activeGame) {
                setLastGame(data.activeGame);
            }
        } catch (e) {
            console.error("[Dice] Fetch state failed", e);
        }
    }, [isConnected, executeQuery]);

    const rollDice = async (amount: number, target: number, mode: 'Over' | 'Under') => {
        if (!owner) {
            console.error("[Dice] Wallet not connected");
            throw new Error("Wallet not connected");
        }
        if (!DICE_APP_ID) {
            console.error("[Dice] APP ID not configured");
            throw new Error("DICE_APP_ID not configured");
        }

        console.log(`[Dice] Rolling: Amount=${amount}, Target=${target}, Mode=${mode}, Owner=${owner}`);
        setLoading(true);

        const modeEnum = mode.toUpperCase(); // GraphQL Enums are typically ALL_CAPS
        const mutation = `mutation {
            rollDice(amount: ${amount}, target: ${target}, rollType: ${modeEnum}, owner: "${owner}")
        }`;
        console.log("[Dice] Mutation:", mutation);

        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(DICE_APP_ID);

            const requestBody = JSON.stringify({ query: mutation });
            console.log("[Dice] Sending transaction...");

            // Explicitly use user owner for payment/mutation to trigger MetaMask
            const result = await app.query(requestBody, { owner });
            console.log("[Dice] Transaction result:", result);

            await fetchState();
            refreshBalance();

        } catch (e) {
            console.error("[Dice] Roll Failed:", e);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (isConnected) {
            fetchState();
        }
    }, [isConnected, fetchState]);

    return {
        rollDice,
        lastGame,
        loading,
        fetchState
    };
};
