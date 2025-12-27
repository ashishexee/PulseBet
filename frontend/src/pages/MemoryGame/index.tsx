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
    } = useMemoryGame();

    const handleCreateGame = async (stake: number) => {
        try {
            await createGame(stake);
        } catch (err) {
            console.error('Failed to create game:', err);
        }
    };

    const handlePlayAgain = () => {
        window.location.reload();
    };

    // No active game - show stake screen
    if (!gameState) {
        return <StakeScreen onCreateGame={handleCreateGame} loading={loading} />;
    }

    // Game finished - show result screen
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
