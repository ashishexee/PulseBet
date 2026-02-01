import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

export type GameState = 'WaitingForPlayers' | 'Playing' | 'Ended';
export type PlayerStatus = 'Active' | 'Left';

export interface Player {
    chainId: string;
    name: string;
    board: number[];
    marked: boolean[];
    isWinner: boolean;
    status: PlayerStatus;
}

export interface GameRoom {
    roomId: string;
    hostChainId: string;
    players: Player[];
    gameState: GameState;
    calledNumbers: number[];
    currentTurnIndex: number | null;
    winnerName: string | null;
    potAmount: number;
}

export const useBingoGame = () => {
    const { client, chainId, isConnected, autosignerOwner } = useLineraWallet();
    const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    const APP_ID = import.meta.env.VITE_BINGO_APP_ID;

    // --- Helpers ---



    // --- Actions ---

    const createGame = async (playerName: string) => {
        setLoading(true);
        setLastError(null);
        try {
            const mutation = `mutation { createGame(playerName: "${playerName}") }`;
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            await refreshState();
        } finally {
            setLoading(false);
        }
    };

    const joinGame = async (hostChainId: string, playerName: string) => {
        setLoading(true);
        setLastError(null);
        try {
            const mutation = `mutation { joinGame(hostChainId: "${hostChainId}", playerName: "${playerName}") }`;
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            await refreshState();
        } finally {
            setLoading(false);
        }
    };

    const pickNumber = async (number: number) => {
        setLoading(true);
        setLastError(null);
        if (!client || !chainId || !APP_ID || !autosignerOwner) return;
        try {
            const mutation = `mutation { pickNumber(number: ${number}) }`;
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            // Optimistic update could happen here, but we'll wait for polling/event
            await refreshState();
        } finally {
            setLoading(false);
        }
    };

    const leaveGame = async () => {
        setLoading(true);
        if (!client || !chainId || !APP_ID || !autosignerOwner) return;
        try {
            const mutation = `mutation { leaveGame }`;
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            setGameRoom(null);
        } finally {
            setLoading(false);
        }
    };

    const hardReset = async () => {
        const confirmed = window.confirm("This will force-clear your local game state. Use only if stuck.");
        if (!confirmed) return;

        setLoading(true);
        if (!client || !chainId || !APP_ID || !autosignerOwner) return;
        try {
            const mutation = `mutation { hardReset }`;
            const chain = await client.chain(chainId);
            const app = await chain.application(APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner: autosignerOwner });
            setGameRoom(null);
        } finally {
            setLoading(false);
        }
    };

    // --- State Polling ---

    const refreshState = useCallback(async () => {
        if (!isConnected || !client || !chainId || !APP_ID) return;

        const query = `query { 
            room {
                roomId
                hostChainId
                players {
                    chainId
                    name
                    board
                    marked
                    isWinner
                    status
                }
                gameState
                calledNumbers
                currentTurnIndex
                winnerName
                potAmount
            }
        }`;

        try {
            // 1. Check Local State first
            const localChain = await client.chain(chainId);
            const localApp = await localChain.application(APP_ID);
            const localResJson = await localApp.query(JSON.stringify({ query }));
            const localRes = JSON.parse(localResJson);

            const localRoom = localRes.data?.room;

            if (localRoom) {
                // We are in a game (Host or Guest)
                if (localRoom.hostChainId === chainId) {
                    // We are Host: Local state is authoritative
                    setGameRoom(localRoom);
                } else {
                    // We are Guest: Poll Host Chain for authoritative state
                    try {
                        const hostChain = await client.chain(localRoom.hostChainId);
                        const hostApp = await hostChain.application(APP_ID);
                        const hostResJson = await hostApp.query(JSON.stringify({ query }));
                        const hostRes = JSON.parse(hostResJson);

                        if (hostRes.data?.room) {
                            setGameRoom(hostRes.data.room);
                        } else {
                            // Fallback or Host closed room?
                            setGameRoom(null);
                            // Optionally handle "Room Deleted" if host returns null
                        }
                    } catch (hostErr) {
                        console.warn("Failed to poll host:", hostErr);
                        // Keep showing local state (stale) or error? 
                        // Show local for now to avoid flicker
                        setGameRoom(localRoom);
                    }
                }
            } else {
                setGameRoom(null);
            }
        } catch (e) {
            console.error("Poll Error:", e);
        }
    }, [isConnected, client, chainId, APP_ID]);

    useEffect(() => {
        const interval = setInterval(refreshState, 1000); // Poll every 1s
        return () => clearInterval(interval);
    }, [refreshState]);

    return {
        gameRoom,
        loading,
        lastError,
        chainId, // Export chainId so UI can show it for hosting
        createGame,
        joinGame,
        pickNumber,
        leaveGame,
        hardReset,
        refreshState
    };
};
