import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

// Define our specific GameState for Dots and Boxes
interface GameState {
    player1: string;
    player2: string | null;
    currentTurn: string;
    gridSize: number;
    horizontalLines: Line[];
    verticalLines: Line[];
    squares: Record<string, string>; 
    status: 'Lobby' | 'Active' | 'Finished';
    scores: [number, number];
    winner: string | null;
}

interface Line {
    start: { row: number, col: number };
    end: { row: number, col: number };
}

export const useDotsAndBoxes = (gameIdInput?: string) => {
    const { client, chainId, isConnected } = useLineraWallet();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(false);

    const APP_ID = import.meta.env.VITE_DOTS_APP_ID;

    const executeQuery = useCallback(async (query: string) => {
        if (!client || !chainId || !APP_ID) return null;
        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query });
            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);
            return response.data;
        } catch (e) {
            console.error("GraphQL execution failed:", e);
            throw e;
        }
    }, [client, chainId, APP_ID]);

    const parseGameId = useCallback((compositeId: string) => {
        const parts = compositeId.split(':');
        if (parts.length === 2) {
            return { hostChainId: parts[0], gameId: parts[1] };
        }
        return { hostChainId: chainId, gameId: compositeId }; // Fallback to local if no prefix
    }, [chainId]);

    const refreshState = useCallback(async () => {
        if (!isConnected || !gameIdInput) return;

        const { gameId } = parseGameId(gameIdInput);

        const FETCH_GAME_STATE = `{
            game(gameId: "${gameId}") {
                player1
                player2
                currentTurn
                gridSize
                horizontalLines { start { row col } end { row col } }
                verticalLines { start { row col } end { row col } }
                squares
                status
                scores
                winner
            }
        }`;

        try {
            const data = await executeQuery(FETCH_GAME_STATE);
            if (data?.game) {
                setGameState(data.game);
            }
        } catch (e) { }
    }, [isConnected, executeQuery, gameIdInput, parseGameId]);

    // Polling
    useEffect(() => {
        if (!gameIdInput) return;
        refreshState();
        const interval = setInterval(refreshState, 2000);
        return () => clearInterval(interval);
    }, [refreshState, gameIdInput]);

    // Mutation Helpers
    const createGame = async (size: number): Promise<string> => {
        setLoading(true);
        // Generate random 32-byte hex string
        const randomId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

        const mutation = `mutation {
            createGame(gameId: "${randomId}", size: ${size})
        }`;

        try {
            await executeQuery(mutation);
            setGameState(null);
            // Return Composite ID: ChainID:GameID
            return `${chainId}:${randomId}`;
        } finally {
            setLoading(false);
        }
    };
    const joinGame = async (compositeId: string) => {
        setLoading(true);
        const { hostChainId, gameId } = parseGameId(compositeId);

        const mutation = `mutation {
            joinGame(gameId: "${gameId}", hostChainId: "${hostChainId}")
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } finally {
            setLoading(false);
        }
    };

    const makeMove = async (compositeId: string, r1: number, c1: number, r2: number, c2: number) => {
        setLoading(true);
        const { hostChainId, gameId } = parseGameId(compositeId);

        const mutation = `mutation {
            makeMove(gameId: "${gameId}", line: { start: { row: ${r1}, col: ${c1} }, end: { row: ${r2}, col: ${c2} } }, hostChainId: "${hostChainId}")
        }`;
        try {
            await executeQuery(mutation);
            await refreshState();
        } finally {
            setLoading(false);
        }
    };

    return {
        gameState,
        loading,
        createGame,
        joinGame,
        makeMove,
        refreshState
    };
};
