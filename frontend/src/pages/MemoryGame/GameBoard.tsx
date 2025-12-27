import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Trophy, Target } from 'lucide-react';

interface GameBoardProps {
    cards: Array<{ position: number; imageId: number }>;
    gameState: {
        turnCount: number;
        matchedCardsCount: number;
        matchedCards: number[];
        firstRevealedCard: number | null;
        stakeAmount: number;
        state: string;
    };
    onRevealCard: (position: number) => Promise<any>;
    loading: boolean;
}

export const GameBoard = ({ cards, gameState, onRevealCard, loading }: GameBoardProps) => {
    const [revealedCards, setRevealedCards] = useState<Map<number, number>>(new Map());
    const [matchedCards, setMatchedCards] = useState<Set<number>>(new Set());
    const [firstCard, setFirstCard] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync state from backend
    useEffect(() => {
        const newRevealed = new Map<number, number>();
        const newMatched = new Set<number>();

        // Sync matched cards
        if (gameState.matchedCards) {
            gameState.matchedCards.forEach(pos => {
                newMatched.add(pos);
                const card = cards.find(c => c.position === pos);
                if (card) {
                    newRevealed.set(pos, card.imageId);
                }
            });
        }

        // Sync first revealed card (if any)
        if (gameState.firstRevealedCard !== null && gameState.firstRevealedCard !== undefined) {
            setFirstCard(gameState.firstRevealedCard);
            const card = cards.find(c => c.position === gameState.firstRevealedCard);
            if (card) {
                newRevealed.set(gameState.firstRevealedCard, card.imageId);
            }
        } else {
            setFirstCard(null);
        }

        setMatchedCards(newMatched);
        setRevealedCards(newRevealed);
    }, [gameState.matchedCards, gameState.firstRevealedCard, cards]);

    const handleCardClick = async (position: number) => {
        if (isProcessing || matchedCards.has(position) || firstCard === position) return;

        setIsProcessing(true);

        try {
            const response = await onRevealCard(position);

            if (response) {
                // Reveal the card
                setRevealedCards(prev => new Map(prev).set(position, response.imageId));

                if (response.isMatch === null) {
                    // First card of turn
                    setFirstCard(position);
                } else {
                    // Second card of turn
                    if (response.isMatch) {
                        // Match found!
                        setTimeout(() => {
                            setMatchedCards(prev => {
                                const newSet = new Set(prev);
                                if (firstCard !== null) newSet.add(firstCard);
                                newSet.add(position);
                                return newSet;
                            });
                            setFirstCard(null);
                        }, 1000);
                    } else {
                        // No match
                        setTimeout(() => {
                            setRevealedCards(prev => {
                                const newMap = new Map(prev);
                                if (firstCard !== null) newMap.delete(firstCard);
                                newMap.delete(position);
                                return newMap;
                            });
                            setFirstCard(null);
                        }, 2000);
                    }
                }
            }
        } catch (err) {
            console.error('Card click error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const calculateMultiplier = (turns: number): number => {
        if (turns === 6) return 20;
        if (turns <= 8) return 5;
        if (turns <= 10) return 3;
        if (turns <= 12) return 1.5;
        return 0;
    };

    const currentMultiplier = calculateMultiplier(gameState.turnCount);
    const potentialPayout = gameState.stakeAmount * currentMultiplier;

    const getStatusColor = (turns: number): string => {
        if (turns <= 6) return 'text-green-400';
        if (turns <= 10) return 'text-yellow-400';
        if (turns <= 12) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a2c38] p-4 font-sans antialiased text-white animate-fade-in">
            <div className="max-w-[1100px] w-full flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-[320px] bg-[#213545] rounded-2xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="flex items-center gap-3 pb-4 border-b border-[#2f4553]/50">
                        <div className="bg-[#0f212e] p-2 rounded-lg border border-[#2f4553]">
                            <Trophy className="w-5 h-5 text-[var(--primary-blue)]" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-[#8a9db5] uppercase tracking-wider">Potential Win</div>
                            <div className="text-xl font-black text-white font-mono leading-none">
                                {potentialPayout} <span className="text-sm font-bold text-[#b1bad3]">PT</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex flex-col gap-3">
                        {/* Turns Stat */}
                        <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex flex-col gap-1 relative overflow-hidden">
                            <label className="text-[10px] font-extrabold text-[#8a9db5] uppercase tracking-wider flex justify-between items-center">
                                Turns Used
                                <span className={`text-xl font-black ${getStatusColor(gameState.turnCount)}`}>
                                    {gameState.turnCount}
                                </span>
                            </label>
                        </div>

                        {/* Matches Stat */}
                        <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold text-[#8a9db5] uppercase tracking-wider flex justify-between items-center">
                                Matches Found
                                <span className="text-xs font-black text-[var(--primary-blue)]">
                                    {Math.floor(gameState.matchedCardsCount / 2)} / 6
                                </span>
                            </label>
                        </div>

                        {/* Multiplier Badge */}
                        <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-[#8a9db5] uppercase tracking-wider">Current Mult.</span>
                            <span className={`text-xl font-black font-mono ${currentMultiplier >= 20 ? 'text-[var(--success-green)] drop-shadow-[0_0_8px_rgba(0,231,1,0.4)]' : 'text-white'
                                }`}>
                                {currentMultiplier}x
                            </span>
                        </div>
                    </div>

                    {/* Warning Message */}
                    {gameState.turnCount >= 10 && gameState.state === 'PLAYING' && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 animate-pulse">
                            <Target className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-red-200 font-medium">
                                <span className="block font-bold text-red-400 mb-0.5">CRITICAL WARNING</span>
                                Only {13 - gameState.turnCount} turns remaining!
                            </div>
                        </div>
                    )}
                </div>

                {/* Game Grid Container */}
                <div className="flex-1 bg-[#0f212e] rounded-2xl p-6 md:p-8 flex items-center justify-center border border-[#2f4553]/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden min-h-[500px]">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    {/* Grid */}
                    <div className="grid grid-cols-4 gap-4 w-full max-w-[480px] aspect-[4/3] relative z-10">
                        {[...Array(12)].map((_, idx) => {
                            const card = cards.find(c => c.position === idx);
                            if (!card) return null;

                            const isRevealed = revealedCards.has(idx);
                            const isMatched = matchedCards.has(idx);
                            const isFirst = firstCard === idx;
                            const imageId = revealedCards.get(idx) ?? null;

                            return (
                                <Card
                                    key={idx}
                                    position={idx}
                                    imageId={imageId}
                                    isRevealed={isRevealed}
                                    isMatched={isMatched}
                                    isFirst={isFirst}
                                    onClick={() => handleCardClick(idx)}
                                    disabled={loading || isProcessing || gameState.state !== 'PLAYING'}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
