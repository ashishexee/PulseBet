import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
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

    const spin = async () => {
        if (betAmount <= 0) return;
        const currentBalance = parseFloat(tokenBalance || '0');
        if (betAmount > currentBalance) {
            toast.error("Insufficient Funds", { description: "Mint more PulseTokens." });
            return;
        }

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

        // Result Toast
        const resultData = WHEEL_DATA[resultIndex];
        if (resultData.value > 0) {
            toast.success("Fortune Favors You!", {
                description: `Hit ${resultData.label} Multiplier! Won ${(betAmount * resultData.value).toFixed(2)} PT`,
                duration: 5000,
            });
        } else {
            toast.error("Entropy Consumed", {
                description: "The Core claimed your stake.",
                duration: 3000
            });
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-24 max-w-full mx-auto p-8 min-h-[600px] h-[calc(100vh-80px)] items-center justify-center animate-fade-in font-sans overflow-hidden">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="wheel"
                gameTitle="Fortune Protocol"
                rules={WHEEL_RULES}
            />

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
