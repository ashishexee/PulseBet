import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export interface GameSession {
    targetWord: string;
    attempts: number;
    guesses: string[];
    feedbackHistory: number[][]; 
    isWon: boolean;
    isOver: boolean;
}

export const useWordle = () => {
    const { client, chainId, isConnected, owner } = useLineraWallet();
    const [gameSession, setGameSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [validWords, setValidWords] = useState<Set<string> | null>(null);

    const APP_ID = import.meta.env.VITE_WORDLE_APP_ID;
    useEffect(() => {
        fetch('/wordle-words.txt')
            .then(res => res.text())
            .then(text => {
                const words = new Set(text.split(/\r?\n/).map(w => w.trim().toUpperCase()));
                setValidWords(words);
            })
            .catch(err => console.error("Failed to load word list:", err));
    }, []);

    const executeQuery = useCallback(async (query: string) => {
        if (!client || !chainId || !APP_ID) return null;

        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query });
            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);
            if (response.errors) {
                console.error("GraphQL Errors:", response.errors);
                throw new Error(response.errors[0].message);
            }
            return response.data;
        } catch (e) {
            console.error("GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, APP_ID]);

    const refreshState = useCallback(async () => {
        if (!isConnected || !owner) return;

        // Query needs owner argument
        const FETCH_GAME = `{
            game(owner: "${owner}") {
                targetWord
                attempts
                guesses
                feedbackHistory
                isWon
                isOver
            }
        }`;

        try {
            const data = await executeQuery(FETCH_GAME);
            if (data?.game) {
                setGameSession(data.game);
            } else {
                setGameSession(null);
            }
        } catch (e) {
            // console.warn("Failed to fetch wordle state", e);
        }
    }, [isConnected, executeQuery, owner]);

    const startGame = async () => {
        setLoading(true);
        const mutation = `mutation {
            startGame
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } catch (e) {
            console.error("Start game failed:", e);
        } finally {
            setLoading(false);
        }
    };

    const submitGuess = async (guess: string) => {
        const upperGuess = guess.toUpperCase();

        if (validWords && !validWords.has(upperGuess)) {
            throw new Error("Word not in dictionary");
        }

        setLoading(true);
        // Ensure guess is valid for string interpolation (sanitize if needed, but it's alphanumeric 5 chars)
        const mutation = `mutation {
            submitGuess(guess: "${upperGuess}")
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } catch (e) {
            console.error("Submit guess failed:", e);
            throw e; // Re-throw so UI can handle it
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates
    useEffect(() => {
        const interval = setInterval(refreshState, 2000);
        return () => clearInterval(interval);
    }, [refreshState]);

    // Initial fetch
    useEffect(() => {
        refreshState();
    }, [refreshState]);

    return {
        gameSession,
        loading,
        startGame,
        submitGuess,
        refreshState
    };
};
