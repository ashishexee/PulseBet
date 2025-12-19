import { useState, useCallback, useEffect } from 'react';
import { useChecko } from './useChecko';

export interface GameState {
    minesCount: number;
    betAmount: string; // Formatting large numbers
    revealedTiles: number[];
    result: 'Active' | 'Won' | 'Lost' | 'CashedOut';
    currentMultiplier: number;
}

export const useMinesGame = () => {
    const { isConnected, graphQLMutation, graphQLQuery } = useChecko();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<string>("0");

    // Queries
    const FETCH_GAME_STATE = `
        query {
            activeGame {
                minesCount
                betAmount
                revealedTiles
                result
                currentMultiplier
            }
            balance
        }
    `;

    const refreshState = useCallback(async () => {
        if (!isConnected) return;
        try {
            const data = await graphQLQuery(FETCH_GAME_STATE);
            if (data?.activeGame) {
                setGameState({
                    minesCount: data.activeGame.minesCount,
                    betAmount: data.activeGame.betAmount,
                    revealedTiles: data.activeGame.revealedTiles,
                    result: data.activeGame.result,
                    currentMultiplier: data.activeGame.currentMultiplier
                });
            } else {
                setGameState(null); // No active game
            }
            if (data?.balance) {
                setBalance(data.balance);
            }
        } catch (e) {
            console.error("Failed to fetch state:", e);
        }
    }, [isConnected, graphQLQuery]);

    // Mutations
    const startGame = async (amount: number, mines: number) => {
        setLoading(true);
        const query = `
            mutation Bet($amount: Int!, $mines: Int!) {
                bet(amount: $amount, minesCount: $mines)
            }
        `;
        try {
            await graphQLMutation(query, { amount, mines });
            await refreshState();
        } catch (e) {
            console.error("Bet failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const revealTile = async (tileId: number) => {
        setLoading(true);
        const query = `
            mutation Reveal($tileId: Int!) {
                reveal(tileId: $tileId)
            }
        `;
        try {
            await graphQLMutation(query, { tileId });
            await refreshState();
        } catch (e) {
            console.error("Reveal failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const cashOut = async () => {
        setLoading(true);
        const query = `
            mutation {
                cashOut
            }
        `;
        try {
            await graphQLMutation(query);
            await refreshState();
        } catch (e) {
            console.error("Cashout failed:", e);
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates (simplified)
    useEffect(() => {
        const interval = setInterval(refreshState, 2000);
        return () => clearInterval(interval);
    }, [refreshState]);

    return {
        gameState,
        balance,
        loading,
        startGame,
        revealTile,
        cashOut,
        refreshState
    };
};
