import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Trophy } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans antialiased text-white animate-fade-in relative selection:bg-white selection:text-black">
            {/* Grain & Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-50%] right-[-20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1200px] w-full flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Stats Sidebar */}
                <div className="w-full md:w-[320px] bg-zinc-950 rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col gap-8 sticky top-8">

                    {/* Header Payout */}
                    <div className="space-y-4 border-b border-zinc-900 pb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Potential Yield</span>
                        </div>
                        <div className="text-5xl font-black tracking-tighter text-white font-mono break-all leading-none">
                            {potentialPayout}<span className="text-lg text-zinc-600 font-bold ml-2">PT</span>
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turns</span>
                            <div className={`text-3xl font-mono font-bold mt-2 ${gameState.turnCount > 10 ? 'text-zinc-500' : 'text-white'}`}>
                                {gameState.turnCount}
                            </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Matched</span>
                            <div className="text-3xl font-mono font-bold mt-2 text-white">
                                {Math.floor(gameState.matchedCardsCount / 2)}<span className="text-sm text-zinc-600 ml-1">/6</span>
                            </div>
                        </div>
                    </div>

                    {/* Multiplier Status */}
                    <div className="p-6 rounded-2xl bg-white text-black relative overflow-hidden group">
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Current Multiplier</div>
                                <div className="text-4xl font-black tracking-tighter font-mono">{currentMultiplier}x</div>
                            </div>
                            <Trophy className="w-8 h-8 text-black opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500" />
                        </div>

                        {/* Progress bar effect behind */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-transparent w-full h-full opacity-50"></div>
                    </div>

                    {gameState.turnCount >= 10 && gameState.state === 'PLAYING' && (
                        <div className="px-5 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed">
                                High entropy detected.<br />Yield decay active.
                            </span>
                        </div>
                    )}
                </div>

                {/* Game Grid */}
                <div className="flex-1 w-full bg-zinc-950 rounded-[2.5rem] p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px] flex items-center justify-center">
                    {/* Subtle grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

                    <div className="grid grid-cols-4 gap-4 md:gap-6 w-full max-w-[600px] aspect-[4/3] relative z-10">
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
