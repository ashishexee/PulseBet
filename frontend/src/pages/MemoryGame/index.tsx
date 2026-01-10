import { useState, useEffect } from 'react';
import { useMemoryGame } from '../../hooks/useMemoryGame';
import { StakeScreen } from './StakeScreen';
import { GameBoard } from './GameBoard';
import { ResultScreen } from './ResultScreen';
import { Loader2, Brain, Clock, Zap } from 'lucide-react';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { GameOverlay } from '../../components/GameOverlay';

const MEMORY_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Match all 6 pairs of cards with the fewest turns possible. Efficiency determines your payout multiplier.
            </p>
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <Brain className="w-5 h-5 text-indigo-400" />
                <div className="text-xs text-zinc-300"><strong>Memorize</strong> card positions to minimize errors.</div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <Clock className="w-5 h-5 text-emerald-400" />
                <div className="text-xs text-zinc-300"><strong>Speed</strong> is not a factor, focus on turn efficiency.</div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="text-xs text-zinc-300"><strong>Multiplier</strong> decreases as turn count increases.</div>
            </div>
        </div>

        <div className="mt-2 text-center text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
            Perfect Game = 20x Multiplier
        </div>
    </div>
);

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

    const { isConnected, connect } = useLineraWallet();

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
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="memory"
                gameTitle="Memory Protocol"
                rules={MEMORY_RULES}
            />
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
