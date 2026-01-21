import { useState, useEffect, useCallback } from 'react';
import { useLineraWallet } from './useLineraWallet';

const MEMORY_GAME_APP_ID = import.meta.env.VITE_MEMORY_GAME_APP_ID;

interface Card {
    position: number;
    imageId: number;
}

interface Game {
    player: string;
    stakeAmount: number;
    turnCount: number;
    matchedCardsCount: number;
    matchedCards: number[];
    firstRevealedCard: number | null;
    state: 'PLAYING' | 'FINISHED' | 'CLAIMED';
    potentialPayout: number;
}

interface CardRevealResponse {
    imageId: number;
    isMatch: boolean | null;
    turnCount: number;
    matchedCardsCount: number;
    matchedCards: number[];
    gameState: 'PLAYING' | 'FINISHED' | 'CLAIMED';
}

export const useMemoryGame = () => {
    const { client, chainId, owner, autosignerOwner } = useLineraWallet();
    const [gameState, setGameState] = useState<Game | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGameReset, setIsGameReset] = useState(false);
    const executeQuery = useCallback(async (query: string) => {
        if (!client || !chainId) return null;

        try {
            const chain = await client.chain(chainId);
            const app = await chain.application(MEMORY_GAME_APP_ID);

            const requestBody = JSON.stringify({ query });
            const responseJson = await app.query(requestBody);
            const response = JSON.parse(responseJson);
            return response.data;
        } catch (err: any) {
            console.error('Query failed:', err);
            return null;
        }
    }, [client, chainId]);
    const fetchGame = useCallback(async (): Promise<boolean> => {
        if (!owner) return false;

        const query = `{
      activeGame {
        player
        stakeAmount
        turnCount
        matchedCardsCount
        matchedCards
        firstRevealedCard
        state
        potentialPayout
      }
    }`;

        try {
            const data = await executeQuery(query);
            // console.log(data); // Reduced log noise
            if (data?.activeGame) {
                // If we are in "reset" mode, only accept a new game that is PLAYING
                if (isGameReset) {
                    if (data.activeGame.state === 'PLAYING') {
                        setIsGameReset(false);
                        setGameState(data.activeGame);
                        return true;
                    }
                    // Still finished/claimed, so ignore it and keep showing null (Stake Screen)
                    return false;
                }

                setGameState(data.activeGame);
                return true;
            } else {
                setGameState(null);
                return false;
            }
        } catch (error) {
            console.error('Fetch game error:', error);
            return false;
        }
    }, [executeQuery, owner, isGameReset]);

    const waitForGameActive = useCallback(async (maxAttempts = 10, delayMs = 1000): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
            const found = await fetchGame();
            if (found) return true;
            await new Promise(r => setTimeout(r, delayMs));
        }
        return false;
    }, [fetchGame]);
    const fetchCards = useCallback(async () => {
        if (!owner) return;

        const query = `{
      cards(player: "${owner}") {
        position
        imageId
      }
    }`;

        const data = await executeQuery(query);
        if (data?.cards) {
            setCards(data.cards);
        }
    }, [executeQuery, owner]);

    const createGame = useCallback(async (stakeAmount: number) => {
        if (!owner) throw new Error('Wallet not connected');

        setLoading(true);
        setError(null);

        try {
            const mutation = `mutation {
        createGame(stakeAmount: ${stakeAmount}, owner: "${owner}")
      }`;

            console.log('🎮 Creating game with mutation:', mutation);
            const chain = await client.chain(chainId);
            const app = await chain.application(MEMORY_GAME_APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner });

            console.log('⏳ Waiting for game to become active...');
            const gameFound = await waitForGameActive(10, 1000);

            if (gameFound) {
                console.log('✅ Successfully loaded game!');
                await fetchCards();
            } else {
                console.error('❌ Game not found after polling');
                throw new Error('Game created but not visible yet. Please refresh.');
            }
        } catch (err: any) {
            console.error('Create game error:', err);
            setError(err.message || 'Failed to create game');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [owner, client, chainId, waitForGameActive, fetchCards]);
    const revealCard = useCallback(async (cardId: number): Promise<CardRevealResponse | null> => {
        setLoading(true);
        setError(null);

        try {
            const mutation = `mutation {
        revealCard(cardId: ${cardId})
      }`;
            if (!client || !chainId || !MEMORY_GAME_APP_ID || !autosignerOwner) throw new Error("Wallet not fully connected");
            const chain = await client.chain(chainId);
            const app = await chain.application(MEMORY_GAME_APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            const responseJson = await app.query(requestBody, { owner: autosignerOwner });
            const response = JSON.parse(responseJson);
            const result = response.data;
            if (!result) {
                throw new Error("Transaction cancelled or failed");
            }
            const card = cards.find(c => c.position === cardId);
            if (!card) throw new Error('Card data not found');

            let isMatch = null;
            let firstCardId = gameState?.firstRevealedCard;

            if (firstCardId !== null && firstCardId !== undefined) {
                // This is the second card
                const firstCard = cards.find(c => c.position === firstCardId);
                if (firstCard) {
                    isMatch = firstCard.imageId === card.imageId;
                }
            }

            fetchGame();

            return {
                imageId: card.imageId,
                isMatch: isMatch,
                turnCount: gameState?.turnCount || 0,
                matchedCardsCount: gameState?.matchedCardsCount || 0,
                matchedCards: gameState?.matchedCards || [],
                gameState: gameState?.state || 'PLAYING'
            };
        } catch (err: any) {
            console.error('Reveal card error:', err);
            setError(err.message || 'Failed to reveal card');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [executeQuery, fetchGame, gameState, cards]);

    const claimPayout = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const mutation = `mutation {
        claimPayout
      }`;

            if (!client || !chainId || !MEMORY_GAME_APP_ID || !owner) throw new Error("Wallet not connected");
            const chain = await client.chain(chainId);
            const app = await chain.application(MEMORY_GAME_APP_ID);
            const requestBody = JSON.stringify({ query: mutation });
            await app.query(requestBody, { owner });
            await fetchGame();
        } catch (err: any) {
            console.error('Claim payout error:', err);
            setError(err.message || 'Failed to claim payout');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [executeQuery, fetchGame]);

    // Calculate potential payout
    const calculatePotentialPayout = useCallback((turnCount: number, stakeAmount: number): number => {
        let multiplier = 0;
        if (turnCount === 6) multiplier = 20;
        else if (turnCount >= 7 && turnCount <= 8) multiplier = 5;
        else if (turnCount >= 9 && turnCount <= 10) multiplier = 3;
        else if (turnCount >= 11 && turnCount <= 12) multiplier = 1.5;

        return stakeAmount * multiplier;
    }, []);

    const resetGame = useCallback(() => {
        setGameState(null);
        setIsGameReset(true);
    }, []);

    useEffect(() => {
        if (owner) {
            fetchGame();
            fetchCards();

            const interval = setInterval(() => {
                fetchGame();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [owner, fetchGame, fetchCards]);

    return {
        gameState,
        cards,
        loading,
        error,
        createGame,
        revealCard,
        claimPayout,
        calculatePotentialPayout,
        resetGame,
    };
};
