import { useState, useCallback, useEffect, useRef } from 'react';
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
    const { client, chainId, isConnected, owner, autosignerOwner } = useLineraWallet();
    const [gameSession, setGameSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [validWords, setValidWords] = useState<Set<string> | null>(null);

    // Use ref to track surrender state immediately without waiting for re-renders
    const isSurrenderedRef = useRef(false);
    const [, forceUpdate] = useState({});

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

        // Query should use autosigner if available since that's who starts the game
        const activeOwner = autosignerOwner || owner;

        // Query needs owner argument
        const FETCH_GAME = `{
            game(owner: "${activeOwner}") {
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
                const game = data.game;
                // Check ref for immediate updates
                if (isSurrenderedRef.current) {
                    game.isOver = true;
                    game.isWon = false;
                }
                setGameSession(game);
            } else {
                setGameSession(null);
            }
        } catch (e) {
            // console.warn("Failed to fetch wordle state", e);
        }
    }, [isConnected, executeQuery, owner]);

    const startGame = async () => {
        if (!client || !chainId || !APP_ID || !autosignerOwner) {
            console.error("AutoSigner not ready");
            return;
        }
        setLoading(true);
        isSurrenderedRef.current = false;
        forceUpdate({}); // Trigger re-render to update UI helper text if needed

        const mutation = `mutation {
            startGame
        }`;
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            console.log("Start game request:", requestBody);
            const response = await app.query(requestBody, { owner: autosignerOwner });
            console.log("Start game response:", response);
            await refreshState();
        } catch (e) {
            console.error("Start game failed:", e);
            isSurrenderedRef.current = true;
            forceUpdate({});
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const submitGuess = async (guess: string) => {
        const upperGuess = guess.toUpperCase();

        if (validWords && !validWords.has(upperGuess)) {
            throw new Error("Word not in dictionary");
        }

        if (!client || !chainId || !APP_ID || !autosignerOwner) return;
        setLoading(true);
        const mutation = `mutation {
            submitGuess(guess: "${upperGuess}")
        }`;
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            console.log("Submit guess request:", requestBody);
            const response = await app.query(requestBody, { owner: autosignerOwner });
            console.log("Submit guess response:", response);
            await refreshState();
        } catch (e) {
            console.error("Submit guess failed:", e);
            throw e; // Re-throw so UI can handle it
        } finally {
            setLoading(false);
        }
    };

    const endGame = useCallback(() => {
        isSurrenderedRef.current = true;
        forceUpdate({}); // Trigger re-render to update UI
        setGameSession(prev => prev ? { ...prev, isOver: true, isWon: false } : null);
    }, []);

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
        endGame,
        refreshState
    };
};
