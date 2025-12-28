import { useState, useEffect } from 'react';
import { useMemoryGame } from '../../hooks/useMemoryGame';
import { StakeScreen } from './StakeScreen';
import { GameBoard } from './GameBoard';
import { ResultScreen } from './ResultScreen';
import { Loader2 } from 'lucide-react';

export const MemoryGame = () => {
    const {
        gameState,
        cards,
        loading,
        error,
        createGame,
        revealCard,
        claimPayout,
        resetGame,
    } = useMemoryGame();

    const [gameActiveInSession, setGameActiveInSession] = useState(false);

    // Track if a game has been physically played in this session to show results
    useEffect(() => {
        if (gameState?.state === 'PLAYING') {
            setGameActiveInSession(true);
        }
    }, [gameState?.state]);

    const handleCreateGame = async (stake: number) => {
        try {
            await createGame(stake);
            setGameActiveInSession(true); // Manually set to true so we see the result when it finishes
        } catch (err) {
            console.error('Failed to create game:', err);
        }
    };

    const handlePlayAgain = () => {
        resetGame();
        setGameActiveInSession(false);
    };

    if (!gameState) {
        return <StakeScreen onCreateGame={handleCreateGame} loading={loading} />;
    }

    // If game is FINISHED but we haven't played in this session (e.g. fresh load), show Stake Screen (New Game)
    // Only show Result Screen if we actually played through to the finish
    if ((gameState.state === 'FINISHED' || gameState.state === 'CLAIMED') && !gameActiveInSession) {
        return <StakeScreen onCreateGame={handleCreateGame} loading={loading} />;
    }

    if (gameState.state === 'FINISHED' || gameState.state === 'CLAIMED') {
        return (
            <ResultScreen
                gameState={gameState}
                onClaimPayout={claimPayout}
                onPlayAgain={handlePlayAgain}
                loading={loading}
            />
        );
    }

    // Game in progress - show game board
    if (gameState.state === 'PLAYING' && cards.length > 0) {
        return (
            <GameBoard
                cards={cards}
                gameState={gameState}
                onRevealCard={revealCard}
                loading={loading}
            />
        );
    }

    // Loading state
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a2c38]">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-[var(--primary-blue)] animate-spin mx-auto mb-4" />
                <div className="text-white text-lg font-bold">LOADING...</div>
                {error && (
                    <div className="mt-4 text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};
