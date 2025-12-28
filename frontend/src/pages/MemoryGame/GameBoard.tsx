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
    const [isMatchAnimation, setIsMatchAnimation] = useState(false);

    useEffect(() => {
        const newRevealed = new Map<number, number>();
        const newMatched = new Set<number>();
        if (isMatchAnimation) return;
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
            setFirstCard(null); ``
        }

        setMatchedCards(newMatched);
        setRevealedCards(newRevealed);
    }, [gameState.matchedCards, gameState.firstRevealedCard, cards, isMatchAnimation]);

    const handleCardClick = async (position: number) => {
        if (isProcessing || isMatchAnimation || matchedCards.has(position) || firstCard === position) return;
        setIsProcessing(true);
        try {
            const response = await onRevealCard(position);
            if (response) {
                if (response.isMatch == false) {
                    setIsMatchAnimation(true);
                }
                setRevealedCards(prev => new Map(prev).set(position, response.imageId));
                if (response.isMatch === null) {
                    setFirstCard(position);
                } else {
                    if (response.isMatch) {
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
                        setTimeout(() => {
                            setRevealedCards(prev => {
                                const newMap = new Map(prev);
                                if (firstCard !== null) newMap.delete(firstCard);
                                newMap.delete(position);
                                return newMap;
                            });
                            setFirstCard(null);
                            setIsMatchAnimation(false);
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



    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans antialiased text-white animate-fade-in relative selection:bg-white selection:text-black">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            <div className="max-w-[1200px] w-full flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Stats Sidebar */}
                <div className="w-full md:w-[320px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 border border-zinc-800/50 shadow-2xl flex flex-col gap-6 sticky top-4">

                    {/* Header Payout */}
                    <div className="pb-6 border-b border-zinc-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-zinc-800 text-white">
                                <Target className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Potential Yield</span>
                        </div>
                        <div className="text-4xl font-bold tracking-tight text-white font-mono">
                            {potentialPayout} <span className="text-lg text-zinc-600 font-medium">PT</span>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turns</span>
                            <div className={`text-2xl font-mono mt-1 ${gameState.turnCount > 10 ? 'text-zinc-500' : 'text-white'}`}>
                                {gameState.turnCount}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Matched</span>
                            <div className="text-2xl font-mono mt-1 text-white">
                                {Math.floor(gameState.matchedCardsCount / 2)} <span className="text-base text-zinc-600">/ 6</span>
                            </div>
                        </div>
                    </div>

                    {/* Multiplier Status */}
                    <div className="p-5 rounded-2xl bg-white text-black relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Current Multiplier</div>
                                <div className="text-3xl font-bold mt-1 font-mono">{currentMultiplier}x</div>
                            </div>
                            <Trophy className="w-6 h-6 opacity-20" />
                        </div>
                        {/* Progress bar effect behind */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-transparent w-full h-full opacity-50"></div>
                    </div>

                    {gameState.turnCount >= 10 && gameState.state === 'PLAYING' && (
                        <div className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-zinc-300">
                                High entropy detected. Result decay imminent.
                            </span>
                        </div>
                    )}
                </div>

                {/* Game Grid */}
                <div className="flex-1 w-full bg-zinc-900/30 rounded-3xl p-6 md:p-10 border border-zinc-800 shadow-2xl relative overflow-hidden min-h-[500px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-zinc-950/50"></div>
                    <div className="grid grid-cols-4 gap-4 w-full max-w-[500px] aspect-[4/3] relative z-10">
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
