import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiceGame } from '../../hooks/useDiceGame';
import { usePulseToken } from '../../hooks/usePulseToken';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { GameOverlay } from '../../components/GameOverlay';
const DICE_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Predict whether the dice roll will be Over or Under your target number.
            </p>
        </div>
        <div className="space-y-3 pt-2">
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-black text-xs">50</div>
                <div className="text-sm text-zinc-300"><strong>Adjust Target</strong> to change your Win Chance and Multiplier.</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="text-green-500 font-bold">$$$</div>
                <div className="text-sm text-zinc-300"><strong>Lower Win Chance</strong> = Higher Payout Multiplier.</div>
            </div>
        </div>
    </div>
);

const Dice = () => {
    const { rollDice, loading, lastGame } = useDiceGame();
    const { tokenBalance: balance } = usePulseToken();
    const { isConnected, connect } = useLineraWallet();

    const [target, setTarget] = useState(50);
    const [amount, setAmount] = useState(10);
    const [mode, setMode] = useState<'Over' | 'Under'>('Under');
    const [error, setError] = useState('');

    const [displayRoll, setDisplayRoll] = useState(50);
    const [isRolling, setIsRolling] = useState(false);

    // Overlay State
    const [showOverlay, setShowOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const winChance = mode === 'Under' ? target : (100 - target);
    const multiplier = winChance > 0 ? (100 / winChance) : 0;
    const potentialPayout = amount * multiplier;

    const handleRoll = async () => {
        setError('');
        if (amount <= 0) {
            setError("Bet amount must be positive");
            return;
        }
        if (amount > Number(balance)) {
            setError("Insufficient balance");
            return;
        }

        setIsRolling(true);
        setShowOverlay(false);

        // Start random shuffle animation
        const interval = setInterval(() => {
            setDisplayRoll(Math.floor(Math.random() * 100));
        }, 50);

        try {
            await rollDice(amount, target, mode);
        } catch (e: any) {
            setError(e.message || "Roll failed");
            setIsRolling(false); // Stop on error
        } finally {
            clearInterval(interval);
        }
    };

    // When lastGame updates (and we were rolling), settle the animation
    useEffect(() => {
        if (lastGame && isRolling) {
            setDisplayRoll(lastGame.resultRoll);
            setIsRolling(false);

            // Show Overlay
            setShowOverlay(true);
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
    }, [lastGame]);

    return (
        <div className="flex w-full min-h-screen bg-black text-white font-sans overflow-hidden relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="dice"
                gameTitle="Pulse Dice"
                rules={DICE_RULES}
            />

            {/* Background Ambient Glow - MONOCHROME */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-zinc-500/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="flex flex-col lg:flex-row w-full h-full relative z-10 p-4 md:p-8 gap-6 max-w-[1400px] mx-auto items-center justify-center">

                {/* LEFT PANEL: CONTROLS */}
                <div className="w-full lg:w-1/3 flex flex-col justify-center space-y-5 bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl">

                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 uppercase">
                            Pulse<span className="text-white">Dice</span>
                        </h1>
                        <p className="text-zinc-500 font-medium">Provably Fair On-Chain Gaming</p>
                    </div>

                    {/* Bet Amount Input */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Wager Amount</label>
                        <div className="relative group">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-black/60 border-2 border-zinc-800 rounded-xl py-4 px-4 text-2xl font-mono text-white focus:outline-none focus:border-white transition-all font-bold group-hover:bg-black/80 shadow-inner"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                                <span className="text-white font-bold text-sm">PULSE</span>
                                <span className="text-zinc-600 text-xs">Token</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-zinc-500">Balance: <span className="text-white">{balance || '0.00'}</span></span>
                            <div className="flex gap-2">
                                <button onClick={() => setAmount(Number(balance) / 2)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded-md transition-colors">1/2</button>
                                <button onClick={() => setAmount(Number(balance))} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-md transition-colors">MAX</button>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        <button
                            onClick={() => setMode('Under')}
                            className={`py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all duration-300 ${mode === 'Under' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            Roll Under
                        </button>
                        <button
                            onClick={() => setMode('Over')}
                            className={`py-3 rounded-lg font-black text-sm uppercase tracking-wider transition-all duration-300 ${mode === 'Over' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            Roll Over
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/80 border border-white/5 p-5 rounded-2xl flex flex-col">
                            <span className="text-zinc-500 text-xs font-bold uppercase mb-1">Multiplier</span>
                            <span className="text-3xl font-mono text-white font-bold">{multiplier.toFixed(2)}x</span>
                        </div>
                        <div className="bg-zinc-900/80 border border-white/5 p-5 rounded-2xl flex flex-col">
                            <span className="text-zinc-500 text-xs font-bold uppercase mb-1">Win Chance</span>
                            <span className="text-3xl font-mono text-white font-bold">{winChance}%</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-zinc-800/50 border border-red-500/50 text-red-400 p-4 rounded-xl text-center text-sm font-bold"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button */}
                    {!isConnected ? (
                        <button onClick={connect} className="w-full py-4 mt-auto bg-white text-black rounded-xl font-black text-xl uppercase tracking-widest hover:bg-zinc-200 shadow-lg transform active:scale-[0.98] transition-all">
                            Connect Wallet
                        </button>
                    ) : (
                        <button
                            onClick={handleRoll}
                            disabled={loading || isRolling}
                            className="w-full py-4 mt-auto bg-white text-black rounded-xl font-black text-xl uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transform hover:-translate-y-1 active:scale-[0.98]"
                        >
                            {loading || isRolling ? (
                                <span className="flex items-center justify-center gap-2 animate-pulse">
                                    Rolling...
                                </span>
                            ) : (
                                <div className="flex flex-col items-center leading-none">
                                    <span>Roll Dice</span>
                                    <span className="text-[10px] opacity-60 font-normal tracking-normal mt-1">Win {potentialPayout.toFixed(2)} PULSE</span>
                                </div>
                            )}
                        </button>
                    )}
                </div>

                {/* RIGHT PANEL: VISUALIZATION */}
                <div className="w-full lg:w-2/3 relative flex flex-col bg-zinc-900/30 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl min-h-[500px]">

                    {/* Top Info Bar */}
                    <div className="absolute top-6 left-0 w-full flex justify-between px-8 z-20">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Target</span>
                            <span className="text-3xl font-black text-white">{mode === 'Under' ? '<' : '>'}{target}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-zinc-500 text-xs font-bold uppercase">Potential Win</span>
                            <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{potentialPayout.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Center: The Roll Number */}
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={displayRoll}
                                initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
                                transition={{ duration: 0.1 }}
                                className={`text-[150px] md:text-[220px] font-black tabular-nums leading-none tracking-tighter mix-blend-screen select-none ${!isRolling && lastGame
                                    ? (Number(lastGame.payout) > 0 ? 'text-white drop-shadow-[0_0_120px_rgba(255,255,255,0.8)]' : 'text-zinc-600 drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]')
                                    : 'text-zinc-400 drop-shadow-[0_0_80px_rgba(255,255,255,0.1)]'
                                    }`}
                            >
                                {displayRoll}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Result Overlay */}
                    <AnimatePresence>
                        {showOverlay && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl"
                            >
                                <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 min-w-[320px] relative overflow-hidden text-center m-4">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowOverlay(false)}
                                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>

                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                            {Number(lastGame?.payout) > 0 ? 'Winning Roll' : 'Round Over'}
                                        </h3>
                                        <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 w-full">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Rolled</div>
                                            <div className="text-3xl font-black text-white">{lastGame?.resultRoll} <span className="text-zinc-600 text-sm">/ 100</span></div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</div>
                                            <div className={`text-3xl font-black ${Number(lastGame?.payout) > 0 ? 'text-white' : 'text-zinc-600'}`}>
                                                {multiplier.toFixed(2)}x
                                            </div>
                                        </div>
                                    </div>

                                    {Number(lastGame?.payout) > 0 && (
                                        <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                            +{lastGame?.payout} PT
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

                    {/* Bottom: Interactive Slider */}
                    <div className="w-full h-24 bg-black/40 border-t border-white/10 relative flex items-center px-8 group">

                        {/* Slider Track Background */}
                        <div className="absolute left-8 right-8 h-4 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                            {/* Win Zone Highlight */}
                            <motion.div
                                className={`h-full absolute top-0 ${mode === 'Under' ? 'bg-gradient-to-r from-zinc-400 to-white' : 'bg-gradient-to-l from-zinc-400 to-white'}`}
                                animate={{
                                    left: mode === 'Over' ? `${target}%` : '0%',
                                    width: mode === 'Over' ? `${100 - target}%` : `${target}%`,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            {/* Ticks */}
                            <div className="absolute inset-0 flex justify-between px-4">
                                {Array.from({ length: 11 }).map((_, i) => (
                                    <div key={i} className="w-0.5 h-full bg-black/20" />
                                ))}
                            </div>
                        </div>

                        {/* Interactive Range Input (Invisible but functional) */}
                        <input
                            type="range"
                            min="1"
                            max="98"
                            step="1"
                            value={target}
                            onChange={(e) => setTarget(Number(e.target.value))}
                            className="absolute left-8 right-8 h-12 opacity-0 cursor-ew-resize z-30"
                        />

                        {/* Slider Thumb Visualization */}
                        <motion.div
                            className="absolute h-10 w-24 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.5)] z-20 pointer-events-none flex items-center justify-center"
                            animate={{ left: `calc(${target}% + 3rem - ${target * 0.06}rem)` }} // Complex math to align thumb center with track percentage accounting for padding
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                            style={{ translateX: "-50%" }}
                        >
                            <span className="text-black font-black text-sm">{target}</span>
                        </motion.div>

                        {/* Result Marker Visualization (if game finished) */}
                        {lastGame && !isRolling && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: '50%' }}
                                className={`absolute top-1/2 -translate-y-1/2 w-1 z-10 ${Number(lastGame.payout) > 0 ? 'bg-white shadow-[0_0_20px_#ffffff]' : 'bg-zinc-600 shadow-[0_0_20px_#52525b]'}`}
                                style={{ left: `calc(${Number(lastGame.resultRoll)}% + 3rem)` }} // Simple approx alignment
                            />
                        )}

                        {/* Scale Labels */}
                        <div className="absolute bottom-4 left-8 text-zinc-600 text-xs font-bold">0</div>
                        <div className="absolute bottom-4 right-8 text-zinc-600 text-xs font-bold">100</div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Dice;
