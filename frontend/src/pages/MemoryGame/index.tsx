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
    useEffect(() => {
        if (gameState?.state === 'PLAYING') {
            setGameActiveInSession(true);
        }
    }, [gameState?.state]);

    const handleCreateGame = async (stake: number) => {
        try {
            await createGame(stake);
            setGameActiveInSession(true);
        } catch (err) {
            console.error('Failed to create game:', err);
        }
    };

    const handlePlayAgain = () => {
        resetGame();
        setGameActiveInSession(false);
    };

    const renderContent = () => {
        if (!gameState) {
            return <StakeScreen onCreateGame={handleCreateGame} loading={loading} />;
        }
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

    return (
        <>
            {renderContent()}
            {loading && (
                <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full animate-pulse opacity-20"></div>
                        </div>
                    </div>
                    <div className="mt-8 font-mono text-xs tracking-[0.2em] text-zinc-500 animate-pulse">
                        INITIALIZING PROTOCOL...
                    </div>
                </div>
            )}
        </>
    );
};
