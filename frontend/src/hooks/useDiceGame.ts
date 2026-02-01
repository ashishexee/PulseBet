import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';
import { usePulseToken } from './usePulseToken';

const DICE_APP_ID = import.meta.env.VITE_DICE_APP_ID;

export interface DiceGameState {
    owner: string;
    betAmount: string;
    target: number;
    resultRoll: number;
    payout: string;
    multiplier: number;
}

export const useDiceGame = () => {
    const { client, chainId, owner, isConnected } = useLineraWallet();
    const [loading, setLoading] = useState(false);
    const [lastGame, setLastGame] = useState<DiceGameState | null>(null);
    const { refreshBalance } = usePulseToken();

    const fetchState = useCallback(async () => {
        if (!client || !chainId || !DICE_APP_ID) return;

        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(DICE_APP_ID);

            const query = `{
                activeGame {
                    owner
                    betAmount
                    target
                    resultRoll
                    payout
                    multiplier
                }
            }`;

            const requestBody = JSON.stringify({ query });
            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);

            if (response.data && response.data.activeGame) {
                setLastGame(response.data.activeGame);
            }
        } catch (e) {
            console.error("Failed to fetch dice state:", e);
        }
    }, [client, chainId]);

    const rollDice = async (amount: number, target: number, mode: 'Over' | 'Under') => {
        if (!client || !chainId || !owner) {
            throw new Error("Wallet not connected");
        }
        if (!DICE_APP_ID) {
            throw new Error("DICE_APP_ID not configured");
        }

        setLoading(true);
        try {
            // mode enum matches Rust: Over, Under (Capitalized)
            const mutation = `mutation {
                rollDice(amount: ${amount}, target: ${target}, rollType: ${mode}, owner: "${owner}")
            }`;

            const chain = await client.chain(chainId);
            const app = await chain.application(DICE_APP_ID);

            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner });

            // Fetch result immediately
            await fetchState();
            refreshBalance(); // Update token balance

        } catch (e) {
            console.error("Dice Roll Failed:", e);
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
