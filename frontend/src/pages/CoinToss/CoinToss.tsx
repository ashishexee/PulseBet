import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, ArrowRight } from 'lucide-react';
import { useCoinToss } from '../../hooks/useCoinToss';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';
import { GameOverlay } from '../../components/GameOverlay';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const COIN_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Predict the outcome of the quantum coin toss. Heads or Tails.
            </p>
        </div>
        <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
            <Coins className="w-5 h-5 text-white" />
            <div className="text-sm text-zinc-300"><strong>Double Your Stack</strong> with a correct prediction. 2x Payout.</div>
        </div>
    </div>
);

export const CoinToss = () => {
    const { lastGame, loading, playToss } = useCoinToss();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance } = usePulseToken();
    const navigate = useNavigate();
    const [betAmount, setBetAmount] = useState<number>(10);
    const [prediction, setPrediction] = useState<'HEADS' | 'TAILS'>('HEADS');
    const [isFlipping, setIsFlipping] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);
    useEffect(() => {
        if (showOverlay) {
            setCountdown(5);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setShowOverlay(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showOverlay]);

    const handleToss = async () => {
        if (betAmount <= 0) {
            toast.error("Invalid Stake");
            return;
        }

        const currentBalance = parseFloat(tokenBalance || '0');
        if (betAmount > currentBalance) {
            toast.error("Insufficient Funds", {
                description: "You don't have enough PulseTokens.",
                action: {
                    label: "Mint Tokens",
                    onClick: () => navigate('/mining/faucets')
                }
            });
            return;
        }

        setIsFlipping(true);
        setShowOverlay(false);

        try {
            await playToss(betAmount, prediction);
            setTimeout(() => {
                setIsFlipping(false);
                setShowOverlay(true);
            }, 3000);

        } catch (e) {
            setIsFlipping(false);
            toast.error("Toss failed");
        }
    };

    // Determine what to show on the coin
    // 0 = Heads, 1 = Tails
    const showHeads = isFlipping ? true : (lastGame ? lastGame.result === 0 : true); // Default Heads

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 min-h-[600px] items-center justify-center animate-fade-in font-sans selection:bg-white selection:text-black relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="cointoss"
                gameTitle="Coin Protocol"
                rules={COIN_RULES}
            />

            {/* RESULT OVERLAY */}
            <AnimatePresence>
                {showOverlay && lastGame && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl pointer-events-none"
                    >
                        <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 pointer-events-auto min-w-[320px] relative overflow-hidden text-center">
                            {/* Close Button */}
                            <button
                                onClick={() => setShowOverlay(false)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>

                            <div className="space-y-1">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                    {lastGame.won ? 'Winning Round' : 'Round Over'}
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 w-full">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Result</div>
                                    <div className="text-2xl font-black text-white">{lastGame.result === 0 ? "HEADS" : "TAILS"}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Prediction</div>
                                    <div className={`text-2xl font-black ${lastGame.won ? 'text-green-400' : 'text-zinc-500'}`}>
                                        {lastGame.prediction === 0 ? "HEADS" : "TAILS"}
                                    </div>
                                </div>
                            </div>

                            {lastGame.won && (
                                <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                    +{lastGame.payout} PT
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

            {/* Left Control Panel */}
            <div className="w-full lg:w-[380px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-8 shadow-2xl border border-zinc-800/50 relative overflow-hidden h-fit">
                {/* Header */}
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/50 mb-2">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Binary Protocol</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-white">Coin Toss</h2>
                    <p className="text-zinc-500 text-sm">50/50 Probability Matrix.</p>
                </div>

                {/* Bet Input */}
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                        Injection Amount
                        <span className="text-white font-mono">{betAmount.toFixed(0)} PT</span>
                    </label>
                    <div className="bg-black/50 p-1.5 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-zinc-600 transition-colors">
                        <div className="flex-1 px-3 py-2">
                            <input
                                type="number"
                                value={betAmount === 0 ? '' : betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={isFlipping || loading}
                                className="bg-transparent text-white font-mono font-bold text-xl w-full outline-none placeholder-zinc-700"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[10, 50, 100, 500].map(val => (
                            <button
                                key={val}
                                onClick={() => setBetAmount(val)}
                                disabled={isFlipping || loading}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase"
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prediction Selection */}
                <div className="bg-black/40 p-1 rounded-xl flex sm:flex-row flex-col gap-1">
                    <button
                        onClick={() => setPrediction('HEADS')}
                        disabled={isFlipping || loading}
                        className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${prediction === 'HEADS' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Heads
                    </button>
                    <button
                        onClick={() => setPrediction('TAILS')}
                        disabled={isFlipping || loading}
                        className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${prediction === 'TAILS' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Tails
                    </button>
                </div>

                {/* Action Button */}
                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99] uppercase tracking-wider text-sm">
                        INITIALIZE WALLET
                    </button>
                ) : (
                    <button
                        onClick={handleToss}
                        disabled={loading || isFlipping || betAmount <= 0}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                    >
                        {isFlipping || loading ? 'FLIPPING...' : 'TOSS COIN'}
                        {!isFlipping && !loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Right Display - The Coin */}
            <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center relative perspective-[1000px]">

                {/* Coin Element */}
                {/* Simple CSS 3D Coin */}
                <div className={`relative w-64 h-64 transition-all duration-100 ease-linear ${isFlipping ? 'animate-[spinY_0.5s_linear_infinite]' : ''}`} style={{ transformStyle: 'preserve-3d', transform: !isFlipping ? (showHeads ? 'rotateY(0deg)' : 'rotateY(180deg)') : '' }}>

                    {/* Heads Side */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400 border-8 border-zinc-300 flex items-center justify-center backface-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        <span className="text-6xl font-black text-black tracking-tighter">H</span>
                        <div className="absolute inset-2 border-4 border-dashed border-black/10 rounded-full"></div>
                    </div>

                    {/* Tails Side */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-black border-8 border-zinc-700 flex items-center justify-center backface-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ transform: 'rotateY(180deg)' }}>
                        <span className="text-6xl font-black text-white tracking-tighter">T</span>
                        <div className="absolute inset-2 border-4 border-dashed border-white/10 rounded-full"></div>
                    </div>
                </div>

                {/* Floor Reflection/Shadow */}
                <div className="absolute bottom-20 w-32 h-4 bg-black/50 blur-xl rounded-[100%] animate-pulse"></div>

                {/* Last Result Text */}


            </div>

            <style>{`
                @keyframes spinY {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
};
