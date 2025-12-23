import { useState, useCallback, useEffect } from 'react';
import { useLineraWallet } from './useLineraWallet';

// Core Types based on Contract Service
export type RoomType = 'Public' | 'Private';
export type RoomState = 'WAITING' | 'IN_GAME' | 'FINISHED';
export type CardState = 'HIDDEN' | 'REVEALED' | 'REMOVED';
export type TurnOutcome = 'Match' | 'NoMatch';

export interface Card {
    id: number;
    imageId: number;
    state: CardState;
}

export interface Player {
    owner: string;
    score: number;
}

export interface TurnInfo {
    player: string;
    card1: { id: number; imageId: number };
    card2: { id: number; imageId: number };
    outcome: TurnOutcome;
}

export interface Room {
    roomId: string;
    roomType: RoomType;
    roomCode?: string;
    player1: Player;
    player2?: Player;
    state: RoomState;
    cards: Card[];
    currentTurn: string;
    lastTurn?: TurnInfo;
}

export const useMemoryGame = () => {
    const { client, chainId, isConnected } = useLineraWallet();
    const [gameState, setGameState] = useState<Room | null>(null);
    const [publicRooms, setPublicRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

    const APP_ID = import.meta.env.VITE_MEMORY_GAME_APP_ID?.trim();

    const executeQuery = useCallback(async (query: string, targetChainId?: string) => {
        if (!client || !chainId || !APP_ID) return null;
        try {
            const chain = await client.chain(targetChainId || chainId);
            const app = await chain.application(APP_ID);
            const responseJson = await app.query(JSON.stringify({ query }));
            const response = JSON.parse(responseJson);
            if (response.errors) {
                console.error("GraphQL Errors:", response.errors);
                // Return null on error so we can handle it gracefully in calling functions if needed
                throw new Error(response.errors[0].message);
            }
            return response.data;
        } catch (e) {
            console.error("GraphQL Execution Error:", e);
            throw e;
        }
    }, [client, chainId, APP_ID]);

    const fetchRoom = useCallback(async (roomId: string) => {
        if (!roomId) return;
        const ROOM_QUERY = `query {
            room(roomId: "${roomId}") {
                roomId
                roomType
                roomCode
                player1 { owner score }
                player2 { owner score }
                state
                cards { id imageId state }
                currentTurn
                lastTurn {
                    player
                    card1 { id imageId }
                    card2 { id imageId }
                    outcome
                }
            }
        }`;
        try {
            setError(null); // Clear previous errors on retry
            const data = await executeQuery(ROOM_QUERY, roomId);
            if (data?.room) {
                setGameState(data.room);
                setActiveRoomId(roomId);
            }
        } catch (e: any) {
            console.warn("Retrying fetch room...", e);
            const msg = e.message || "Connection Failed";
            if (msg.includes("Blobs not found")) {
                setError("Syncing Network... (Waiting for Bytecode)");
            } else if (msg.includes("Events not found")) {
                setError("Syncing Network... (Waiting for Events)");
            } else {
                setError(msg);
            }
        }
    }, [executeQuery]);

    const refreshState = useCallback(async () => {
        if (!isConnected || !chainId) return;

        // 1. Get the Creation Chain ID (Lobby Chain)
        const INFO_QUERY = `query { creationChainId }`;
        let lobbyChainId = chainId;

        try {
            const info = await executeQuery(INFO_QUERY);
            if (info?.creationChainId) {
                lobbyChainId = info.creationChainId;
            }
        } catch (e) {
            console.warn("Could not fetch creationChainId, defaulting to local chain", e);
        }

        // 2. Query Public Rooms and Active Game
        const LOBBY_QUERY = `query {
            publicRooms(limit: 10) {
                roomId
                roomType
                player1 { owner score }
                state
            }
            activeGame
        }`;

        try {
            const data = await executeQuery(LOBBY_QUERY, lobbyChainId);
            if (data?.publicRooms) {
                setPublicRooms(data.publicRooms);
            }
            if (data?.activeGame) {
                console.log("Found active game:", data.activeGame);
                setActiveRoomId(data.activeGame);
                // Immediately fetch that room to populate gameState
                await fetchRoom(data.activeGame);
            }
        } catch (e) {
            // ignore
        }

    }, [isConnected, chainId, executeQuery, fetchRoom]);

    // Initial load public rooms
    useEffect(() => {
        refreshState();
    }, [refreshState]);

    const [error, setError] = useState<string | null>(null);

    const createRoom = async (type: RoomType, code?: string) => {
        setLoading(true);
        const codeArg = code ? `"${code}"` : "null";
        const mutation = `mutation {
                createRoom(roomType: ${type.toUpperCase()}, roomCode: ${codeArg})
            }`;
        try {
            await executeQuery(mutation);
            if (chainId) {
                setActiveRoomId(chainId); // Optimistically set active room
                await fetchRoom(chainId);
            }
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async (roomId: string, code?: string) => {
        setLoading(true);
        const codeArg = code ? `"${code}"` : "null";
        const mutation = `mutation {
                joinRoom(roomId: "${roomId}", roomCode: ${codeArg})
            }`;
        try {
            await executeQuery(mutation);
            setActiveRoomId(roomId); // Optimistically set active room so polling starts
            await fetchRoom(roomId);
        } finally {
            setLoading(false);
        }
    };

    const playTurn = async (roomId: string, cardIds: [number, number]) => {
        const mutation = `mutation {
                playTurn(roomId: "${roomId}", cardIds: [${cardIds[0]}, ${cardIds[1]}])
            }`;
        try {
            await executeQuery(mutation);
            await fetchRoom(roomId);
        } catch (e) {
            console.error(e);
        }
    };

    const startGame = async (roomId: string) => {
        setLoading(true);
        const mutation = `mutation {
            startGame(roomId: "${roomId}")
        }`;
        try {
            await executeQuery(mutation);
            await fetchRoom(roomId);
        } finally {
            setLoading(false);
        }
    };

    const endGame = async (roomId: string) => {
        setLoading(true);
        const mutation = `mutation {
                endRoom(roomId: "${roomId}")
            }`;
        try {
            await executeQuery(mutation);
            setGameState(null);
            setActiveRoomId(null);
        } finally {
            setLoading(false);
        }
    };

    // Polling active game
    useEffect(() => {
        if (!activeRoomId) return;
        const interval = setInterval(() => {
            fetchRoom(activeRoomId);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeRoomId, fetchRoom]);

    return {
        gameState,
        publicRooms,
        loading,
        createRoom,
        joinRoom,
        playTurn,
        startGame,
        endGame,
        refreshLobby: refreshState,
        setGameId: setActiveRoomId,
        activeRoomId,
        error
    };
};
