import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useWheelGame } from '../../hooks/useWheelGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';
import { GameOverlay } from '../../components/GameOverlay';
import { toast } from 'sonner';

const WHEEL_DATA = [
    { label: '0x', color: '#18181b', value: 0 },    // 0
    { label: '1.5x', color: '#3b82f6', value: 1.5 }, // 1
    { label: '0x', color: '#18181b', value: 0 },    // 2
    { label: '10x', color: '#ec4899', value: 10 },  // 3 (Jackpot)
    { label: '1.2x', color: '#10b981', value: 1.2 }, // 4
    { label: '0x', color: '#18181b', value: 0 },    // 5
    { label: '5x', color: '#8b5cf6', value: 5 },    // 6
    { label: '1.5x', color: '#3b82f6', value: 1.5 }, // 7
    { label: '0x', color: '#18181b', value: 0 },    // 8
    { label: '3x', color: '#f59e0b', value: 3 },    // 9
];

const WHEEL_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Fortune Protocol</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                A deterministic probability engine. Stake PulseTokens to interact with the Fortune Core.
            </p>
        </div>
        <div className="space-y-3 pt-2">
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="w-5 h-5 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                <div className="text-sm text-zinc-300"><strong>The Core</strong> spins with true on-chain entropy.</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="text-yellow-500 font-bold">⚠️</div>
                <div className="text-sm text-zinc-300"><strong>Jackpot:</strong> 10x Multiplier (Pink Segment). Risk: 0x (Black Segments).</div>
            </div>
        </div>
    </div>
);

export const Wheel = () => {
    const { spinWheel, loading: gameLoading } = useWheelGame();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance, refreshBalance } = usePulseToken();

    const [betAmount, setBetAmount] = useState<number>(0);
    const [rotation, setRotation] = useState(0);
    const controls = useAnimation();

    // Overlay State
    const [showOverlay, setShowOverlay] = useState(false);
    const [lastResult, setLastResult] = useState<{ index: number; win: number } | null>(null);
    const [countdown, setCountdown] = useState(5);

    const spin = async () => {
        if (betAmount <= 0) return;
        const currentBalance = parseFloat(tokenBalance || '0');
        if (betAmount > currentBalance) {
            toast.error("Insufficient Funds", { description: "Mint more PulseTokens." });
            return;
        }

        setShowOverlay(false); // Hide previous overlay if any
        toast.info("Consulting Oracle...", { duration: 1000 });
        const resultIndex = await spinWheel(betAmount);

        if (resultIndex === null || resultIndex === undefined) {
            toast.error("Entropy Failure", { description: "The oracle did not respond." });
            return;
        }

        // Calculate Rotation
        // The Wheel SVG is rotated -90deg via CSS.
        // Index 0 starts at 0deg (Top) and goes to 36deg (Clockwise).
        // Center of Index 0 is 18deg.
        // Pointer is at Top (0deg).
        // To align Index 0 center (18deg) with Pointer (0deg), we rotate -18deg.
        // General Formula: -(Index * 36 + 18).
        let nextRotation = -(resultIndex * 36 + 18);

        // adjust to be just below current rotation (to ensure continuity)
        // We find the nearest multiple of 360 + offset that is <= current rotation
        while (nextRotation > rotation) {
            nextRotation -= 360;
        }

        // Add 5 full rotations for effect
        const minSpin = 360 * 5;
        nextRotation -= minSpin;

        await controls.start({
            rotate: nextRotation,
            transition: {
                duration: 4,
                ease: "circOut", // Fast start, slow stop
                type: "tween"
            }
        });

        setRotation(nextRotation); // Save state

        // Refresh Balance specificially after visual spin ends
        await refreshBalance?.();

        // Show Overlay
        const resultData = WHEEL_DATA[resultIndex];
        setLastResult({ index: resultIndex, win: betAmount * resultData.value });
        setShowOverlay(true);
        setCountdown(5);

        // Auto-close timer
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setShowOverlay(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup verification is hard here without ref, but simple interval is fine for now. 
        // Better to use useEffect for countdown but inline is okay for this flow if carefully managed.
        // Refactoring to useEffect for consistency with other games.
    };

    // Countdown Effect
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

    return (
        <div className="flex flex-col xl:flex-row gap-24 max-w-full mx-auto p-8 min-h-[600px] h-[calc(100vh-80px)] items-center justify-center animate-fade-in font-sans overflow-hidden relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="wheel"
                gameTitle="Fortune Protocol"
                rules={WHEEL_RULES}
            />

            {/* Result Overlay */}
            <AnimatePresence>
                {showOverlay && lastResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-2xl"
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
                                    {lastResult.win > 0 ? 'Winning Spin' : 'Round Over'}
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 w-full">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Segment</div>
                                    <div className="text-3xl font-black text-white" style={{ color: WHEEL_DATA[lastResult.index].color }}>
                                        {WHEEL_DATA[lastResult.index].label}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</div>
                                    <div className={`text-3xl font-black ${lastResult.win > 0 ? 'text-white' : 'text-zinc-600'}`}>
                                        {WHEEL_DATA[lastResult.index].value}x
                                    </div>
                                </div>
                            </div>

                            {lastResult.win > 0 && (
                                <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                    +{lastResult.win.toFixed(2)} PT
                                </div>
                            )}

                            {/* Timer Bar */}
                            <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-white"
                                    key={showOverlay ? 'active' : 'inactive'}
                                />
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                                Closing in {countdown}s
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Controls */}
            <div className="w-full max-w-[420px] bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 flex flex-col gap-6 shadow-2xl border border-zinc-800/50 shrink-0">
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Wheel</h2>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Spin the Chaos</p>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                        Injection Amount
                        <span className="text-white font-mono">{betAmount.toFixed(0)} PT</span>
                    </label>
                    <div className="bg-black/60 p-2 rounded-2xl border border-zinc-800 flex items-center gap-2 focus-within:border-purple-500/50 transition-all shadow-inner">
                        <div className="flex-1 px-3 py-2">
                            <input
                                type="number"
                                value={betAmount === 0 ? '' : betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={gameLoading}
                                className="bg-transparent text-white font-mono font-bold text-2xl w-full outline-none placeholder-zinc-800"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-1 pr-1">
                            <button onClick={() => setBetAmount(betAmount / 2)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-4 py-3 rounded-xl uppercase">1/2</button>
                            <button onClick={() => setBetAmount(betAmount * 2)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-4 py-3 rounded-xl uppercase">2x</button>
                        </div>
                    </div>
                </div>

                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm shadow-purple-900/20">
                        Initializing System...
                    </button>
                ) : (
                    <button
                        onClick={spin}
                        disabled={gameLoading || betAmount <= 0}
                        className="w-full bg-white hover:bg-zinc-100 text-black font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        {gameLoading ? "SPINNING..." : "SPIN WHEEL"}
                    </button>
                )}
            </div>

            {/* Right Wheel */}
            <div className="flex-1 flex items-center justify-center relative min-h-[480px]">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-8 h-12">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-t-[32px] border-t-white border-r-[16px] border-r-transparent drop-shadow-xl filter"></div>
                </div>

                <motion.div
                    className="relative w-[480px] h-[480px] rounded-full border-8 border-zinc-900 shadow-2xl bg-zinc-950 overflow-hidden"
                    animate={controls}
                    style={{
                        boxShadow: '0 0 100px -20px rgba(168, 85, 247, 0.3)'
                    }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {WHEEL_DATA.map((segment, index) => {
                            // Calculate SVG path for wedge (36 deg per wedge)
                            const startAngle = index * 36;
                            const endAngle = (index + 1) * 36;

                            // Convert polar to cartesian
                            const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                            const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                            const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                            const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);

                            const largeArc = 0;

                            return (
                                <g key={index}>
                                    <path
                                        d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                                        fill={segment.color}
                                        stroke="#18181b"
                                        strokeWidth="0.5"
                                    />
                                    {/* Text Label */}
                                    <text
                                        x={50 + 35 * Math.cos(Math.PI * (startAngle + 18) / 180)}
                                        y={50 + 35 * Math.sin(Math.PI * (startAngle + 18) / 180)}
                                        fill="white"
                                        fontSize="4"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(${startAngle + 18 + 90}, ${50 + 35 * Math.cos(Math.PI * (startAngle + 18) / 180)}, ${50 + 35 * Math.sin(Math.PI * (startAngle + 18) / 180)})`}
                                    >
                                        {segment.label}
                                    </text>
                                </g>
                            )
                        })}
                    </svg>

                    {/* Center Cap */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-10 border-4 border-zinc-200">
                        <div className="w-10 h-10 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                </motion.div>

                {/* Glow Behind */}
                <div className="absolute inset-0 bg-purple-500/10 blur-3xl -z-10 rounded-full transform scale-110"></div>
            </div>
        </div>
    );
};
