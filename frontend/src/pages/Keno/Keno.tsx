import { useState, useEffect } from 'react';
import { useKenoGame } from '../../hooks/useKenoGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';
import { GameOverlay } from '../../components/GameOverlay';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const KENO_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Select up to 10 numbers. Matches determine your payout.
            </p>
        </div>
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Math of 10 Picks</h4>
            <p className="text-zinc-500 text-xs leading-relaxed">
                Hitting 1-4 numbers is statistically most common, so they pay <strong>0x</strong>.
                <br />
                <strong>0 Hits:</strong> 1x (Money Back)
                <br />
                <strong>5 Hits:</strong> 0.5x
                <br />
                <strong>6 Hits:</strong> 2x
                <br />
                <strong>10 Hits:</strong> 10,000x Jackpot
            </p>
        </div>
        <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-black text-xs">ℹ</div>
            <div className="text-xs text-zinc-400"><strong>Tip:</strong> Pick fewer numbers (e.g. 3-4) to win on fewer hits!</div>
        </div>
    </div>
);

const PAYOUT_MULTIPLIERS: Record<number, Record<number, number>> = {
    1: { 1: 3.8 },
    2: { 2: 14 },
    3: { 3: 45, 2: 1 },
    4: { 4: 80, 3: 4, 2: 0.5 },
    5: { 5: 250, 4: 15, 3: 2 },
    6: { 6: 500, 5: 30, 4: 3, 3: 0.5 },
    7: { 7: 1000, 6: 100, 5: 12, 4: 1 },
    8: { 8: 2000, 7: 250, 6: 50, 5: 4 },
    9: { 9: 5000, 8: 1000, 7: 80, 6: 6, 4: 0.5 },
    10: { 10: 10000, 9: 2000, 8: 200, 7: 20, 6: 2, 5: 0.5, 0: 1 }
};

export const Keno = () => {
    const { gameState, loading, playKeno } = useKenoGame();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance } = usePulseToken();

    const [betAmount, setBetAmount] = useState<number>(0);
    const [picks, setPicks] = useState<number[]>([]);

    // Visual state for animation
    const [displayDrawn, setDisplayDrawn] = useState<number[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const showOverlay = !isAnimating && gameState?.timestamp && picks.length > 0 && displayDrawn.length === 10;

    // Countdown logic for overlay
    useEffect(() => {
        if (showOverlay) {
            setCountdown(5);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setDisplayDrawn([]); // Auto-close
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showOverlay]);

    const togglePick = (num: number) => {
        if (loading || isAnimating) return;

        if (picks.includes(num)) {
            setPicks(picks.filter(p => p !== num));
        } else {
            if (picks.length >= 10) {
                toast.error("Max 10 Numbers", { description: "You can only select up to 10 numbers." });
                return;
            }
            setPicks([...picks, num]);
        }
    };

    const pickRandom = () => {
        if (loading || isAnimating) return;
        const newPicks: number[] = [];
        while (newPicks.length < 10) {
            const r = Math.floor(Math.random() * 40) + 1;
            if (!newPicks.includes(r)) newPicks.push(r);
        }
        setPicks(newPicks);
    };

    const handlePlay = async () => {
        if (betAmount <= 0) return toast.error("Invalid Stake");
        if (picks.length === 0) return toast.error("Pick Numbers", { description: "Select at least 1 number." });

        const currentBalance = parseFloat(tokenBalance || '0');
        if (betAmount > currentBalance) return toast.error("Insufficient Funds");

        // Clear previous results visually
        setDisplayDrawn([]);
        setIsAnimating(true);

        try {
            await playKeno(betAmount, picks);
        } catch (e) {
            setIsAnimating(false);
        }
    };

    // Handle Game Result Animation
    useEffect(() => {
        if (gameState?.timestamp && isAnimating) {
            const drawn = gameState.drawnNumbers;
            let i = 0;
            const interval = setInterval(() => {
                setDisplayDrawn(prev => [...prev, drawn[i]]);
                i++;
                if (i >= drawn.length) {
                    clearInterval(interval);
                    setIsAnimating(false);
                    // Show result toast
                    if (gameState.payout && Number(gameState.payout) > 0) {
                        toast.success("WINNER!", { description: `You won ${gameState.payout} PT` });
                    }
                }
            }, 200); // Reveal speed
            return () => clearInterval(interval);
        }
    }, [gameState?.timestamp]); // Trigger when timestamp updates (new game)

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto p-6 min-h-[600px] items-start justify-center animate-fade-in font-sans">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="keno"
                gameTitle="Keno Protocol"
                rules={KENO_RULES}
            />

            {/* RESULT OVERLAY */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl pointer-events-none"
                    >
                        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 pointer-events-auto min-w-[320px] relative overflow-hidden text-center">
                            {/* Close Button */}
                            <button
                                onClick={() => setDisplayDrawn([])}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>

                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                    {Number(gameState.multiplier) > 0 ? 'Winning Round' : 'Round Over'}
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 w-full">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Matches</div>
                                    <div className="text-3xl font-black text-white">{gameState.hits} <span className="text-zinc-600 text-sm">/ 10</span></div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</div>
                                    <div className={`text-3xl font-black ${Number(gameState.multiplier) > 0 ? 'text-white' : 'text-zinc-600'}`}>
                                        {Number(gameState.multiplier).toFixed(2)}x
                                    </div>
                                </div>
                            </div>

                            {Number(gameState.payout) > 0 && (
                                <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                    +{gameState.payout} PT
                                </div>
                            )}

                            {/* Timer Bar */}
                            <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-white"
                                />
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                                Closing in {countdown}s
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTROL PANEL */}
            <div className="w-full lg:w-[400px] bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-8 flex flex-col gap-6 shadow-2xl border border-zinc-800/50 shrink-0">
                <div className="space-y-1 border-b border-zinc-800 pb-4">
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Keno</h2>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Combinatorial Matrix</p>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex justify-between">
                        Stake Amount <span className="text-white">{betAmount.toFixed(0)} PT</span>
                    </label>
                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 flex gap-2">
                        <input
                            type="number"
                            value={betAmount === 0 ? '' : betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="bg-transparent text-white font-mono font-bold text-xl w-full px-2 outline-none"
                            placeholder="0.00"
                            disabled={loading || isAnimating}
                        />
                        <button onClick={() => setBetAmount(betAmount * 2)} className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 rounded-lg hover:bg-zinc-700">2x</button>
                        <button onClick={() => setBetAmount(betAmount / 2)} className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 rounded-lg hover:bg-zinc-700">1/2</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={pickRandom} disabled={loading || isAnimating} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider">
                        Auto Pick
                    </button>
                    <button onClick={() => setPicks([])} disabled={loading || isAnimating} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-xl text-xs uppercase tracking-wider">
                        Clear ({picks.length})
                    </button>
                </div>

                {/* PAYOUT TABLE PREVIEW */}
                <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50 flex-1 min-h-[200px]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Payout Structure</span>
                        <span className="text-[10px] font-bold text-white uppercase bg-zinc-800 px-2 py-0.5 rounded">{picks.length} Picks</span>
                    </div>
                    <div className="space-y-1">
                        {picks.length > 0 ? (
                            Object.entries(PAYOUT_MULTIPLIERS[picks.length] || {}).reverse().map(([hits, multi]) => (
                                <div key={hits} className={`flex justify-between text-xs py-1 px-2 rounded ${gameState?.hits === Number(hits) && !isAnimating && gameState?.timestamp ? 'bg-green-500/20 text-green-400 font-bold border border-green-500/30' : 'text-zinc-400'}`}>
                                    <span>{hits}x matches</span>
                                    <span className="font-mono">{multi}x</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-zinc-600 text-xs py-8">Select numbers to view payouts</div>
                        )}
                    </div>
                </div>

                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-white text-black font-black py-4 rounded-xl shadow-lg uppercase tracking-wider text-sm">
                        Connect Wallet
                    </button>
                ) : (
                    <button
                        onClick={handlePlay}
                        disabled={loading || isAnimating || picks.length === 0 || betAmount <= 0}
                        className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl shadow-lg uppercase tracking-wider text-sm transition-all"
                    >
                        {loading || isAnimating ? 'Processing...' : 'Place Bet'}
                    </button>
                )}
            </div>

            {/* GAME GRID */}
            <div className="flex-1 bg-zinc-900/30 backdrop-blur-md rounded-3xl p-8 lg:p-12 border border-zinc-800/50 shadow-2xl relative overflow-hidden min-h-[600px] flex items-center justify-center">
                <div className="grid grid-cols-5 md:grid-cols-8 gap-3 w-full max-w-[800px]">
                    {Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
                        const isSelected = picks.includes(num);
                        const isDraw = displayDrawn.includes(num);
                        const isHit = isSelected && isDraw;

                        return (
                            <button
                                key={num}
                                onClick={() => togglePick(num)}
                                disabled={loading || isAnimating}
                                className={`
                                    relative aspect-square rounded-xl font-bold text-lg md:text-xl transition-all duration-300 flex items-center justify-center
                                    ${isHit
                                        ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-110 z-10'
                                        : isDraw
                                            ? 'bg-zinc-700 text-white scale-100 z-0'
                                            : isSelected
                                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                                                : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                                    }
                                `}
                            >
                                {num}
                                {isHit && (
                                    <motion.div
                                        layoutId="hit-glow"
                                        className="absolute inset-0 rounded-xl bg-green-400 blur-md -z-10"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.5 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
