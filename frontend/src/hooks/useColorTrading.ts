import { useState, useEffect, useCallback, useRef } from 'react';
import { useLineraWallet } from './useLineraWallet';

const APP_ID = import.meta.env.VITE_COLOR_TRADING_APP_ID;

export const Color = {
    ColorA: 'COLOR_A',
    ColorB: 'COLOR_B',
    ColorC: 'COLOR_C',
    ColorD: 'COLOR_D',
    ColorE: 'COLOR_E',
} as const;
export type Color = typeof Color[keyof typeof Color];

export const RoundState = {
    Betting: 'BETTING',
    Revealing: 'REVEALING',
    Cooldown: 'COOLDOWN',
} as const;
export type RoundState = typeof RoundState[keyof typeof RoundState];

export interface Round {
    roundId: number;
    startTime: string;
    state: RoundState;
    winningColor: Color | null;
    bets: BetData[];
}

export interface BetData {
    owner: string;
    amount: string;
    color: Color;
    roundId: number;
}

export const useColorTrading = () => {
    const { client, chainId, owner } = useLineraWallet();
    const [hasFetched, setHasFetched] = useState(false);
    const [round, setRound] = useState<Round | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastWin, setLastWin] = useState<{ amount: string, color: Color } | null>(null);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const isTransitioning = useRef(false);

    const executeQuery = useCallback(async (query: string) => {
        if (!client || !chainId || !APP_ID) return null;

        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);

            const requestBody = JSON.stringify({ query });
            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);
            if (response.errors) {
                console.error('GraphQL errors:', response.errors);
                return null;
            }
            return response.data;
        } catch (err: any) {
            console.error('Query failed:', err);
            return null;
        }
    }, [client, chainId]);

    const executeTransition = useCallback(async (mutation: string) => {
        if (isTransitioning.current) return;
        isTransitioning.current = true;
        console.log(`🤖 Auto-triggering transition: ${mutation}`);
        try {
            await executeQuery(mutation);
        } catch (e) {
            console.error("Auto-transition failed:", e);
        } finally {
            setTimeout(() => { isTransitioning.current = false; }, 5000);
        }
    }, [executeQuery]);

    const fetchState = useCallback(async () => {
        const query = `{
            activeRound {
                roundId
                startTime
                state
                winningColor
                bets {
                    owner
                    amount
                    color
                    roundId
                }
            }
        }`;

        try {
            const data = await executeQuery(query);
            if (data?.activeRound) {
                const newRound = data.activeRound;

                if (newRound.winningColor && owner) {
                    const userWinningBets = newRound.bets.filter((b: BetData) => b.owner === owner && b.color === newRound.winningColor);

                    if (userWinningBets.length > 0 && newRound.state !== RoundState.Betting) {
                        // Calculate total winning amount
                        const totalAmount = userWinningBets.reduce((sum: number, bet: BetData) => sum + Number(bet.amount), 0);

                        setLastWin({
                            amount: totalAmount.toString(),
                            color: newRound.winningColor
                        });
                    }
                } else if (newRound.state === RoundState.Betting) {
                    // Reset on new betting round
                    setLastWin(null);
                }

                setRound(newRound);

                const startMicros = parseInt(newRound.startTime);
                const nowMicros = Date.now() * 1000;
                const elapsed = nowMicros - startMicros;

                console.log(`🔄 Round ${newRound.roundId} | State: ${newRound.state} | Elapsed: ${(elapsed / 1000000).toFixed(2)}s`);

                if (newRound.state === RoundState.Betting) {
                    const remaining = Math.max(0, 40000000 - elapsed);
                    setTimeLeft(Math.floor(remaining / 1000000));

                    // Auto-Trigger Reveal if time is up + 2s buffer
                    if (elapsed > 42000000) {
                        console.warn(`⏳ Betting time exceeded (${(elapsed / 1000000).toFixed(2)}s > 42s). Triggering REVEAL...`);
                        executeTransition("mutation { reveal }");
                    }

                } else {
                    const remaining = Math.max(0, 50000000 - elapsed);
                    setTimeLeft(Math.floor(remaining / 1000000));

                    // Auto-Trigger StartRound if time is up + 2s buffer
                    if (elapsed > 52000000) {
                        console.warn(`⏳ Cooldown time exceeded (${(elapsed / 1000000).toFixed(2)}s > 52s). Triggering START ROUND...`);
                        executeTransition("mutation { startRound }");
                    }
                }
            }
        } catch (e) {
            console.error("❌ Error fetching round state:", e);
        } finally {
            setHasFetched(true);
        }
    }, [executeQuery, executeTransition, owner]);

    const startGame = useCallback(async () => {
        if (isTransitioning.current) return;
        setLoading(true);
        try {
            await executeTransition("mutation { startRound }");
            // Wait a bit for block to be mined
            setTimeout(fetchState, 1000);
        } catch (e) {
            console.error("Failed to start game:", e);
            setError("Failed to start game");
        } finally {
            setLoading(false);
        }
    }, [executeTransition, fetchState]);

    // Timer logic matches fetchState logic now
    useEffect(() => {
        const timer = setInterval(() => {
            if (!round) return;

            const startMicros = parseInt(round.startTime);
            const nowMicros = Date.now() * 1000;
            const elapsed = nowMicros - startMicros;


            if (round.state === RoundState.Betting) {
                const remaining = Math.max(0, 40000000 - elapsed);
                const seconds = Math.floor(remaining / 1000000);
                setTimeLeft(seconds);

                if (elapsed > 42000000) {
                    // Log only once per second to avoid spam if feasible, but hook logic handles spam via isTransitioning
                }
            } else {
                const remaining = Math.max(0, 50000000 - elapsed);
                const seconds = Math.floor(remaining / 1000000);
                setTimeLeft(seconds);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [round]);



    // Stop aggressive polling when state changes
    useEffect(() => {
        if (round?.state === RoundState.Betting && timeLeft > 35 && pollingRef.current) {
            console.log("🛑 Stopping aggressive polling.");
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, [round, timeLeft]);

    const placeBet = useCallback(async (amount: number, color: Color) => {
        if (!owner) throw new Error('Wallet not connected');
        if (round?.state !== RoundState.Betting) throw new Error('Betting is closed');

        setLoading(true);
        setError(null);

        try {
            // Check if user already bet in this round (optional check, contract allows multiple now but 1 per user is best for UI)
            const mutation = `mutation {
                bet(amount: ${amount}, color: ${color})
            }`;

            const result = await executeQuery(mutation);
            if (!result) throw new Error("Mutation failed");

            await fetchState();
        } catch (err: any) {
            console.error('Bet error:', err);
            setError(err.message || 'Failed to place bet');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [owner, round, executeQuery, fetchState]);

    useEffect(() => {
        if (client && chainId) {
            fetchState();
            const interval = setInterval(fetchState, 15000);
            return () => {
                clearInterval(interval);
                if (pollingRef.current) clearInterval(pollingRef.current);
            };
        }
    }, [client, chainId, fetchState]);

    return {
        round,
        timeLeft,
        loading,
        error,
        placeBet,
        fetchState,
        startGame,
        hasFetched,
        lastWin
    };
};
