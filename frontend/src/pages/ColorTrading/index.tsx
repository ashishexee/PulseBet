import { useState } from 'react';
import { Timer, Trophy, Users, History, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorTrading, Color, RoundState } from '../../hooks/useColorTrading';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';

const COLOR_CONFIG = {
    [Color.ColorA]: { name: 'Emerald', class: 'bg-emerald-500', hover: 'hover:shadow-emerald-500/50', multiplier: '3.0x' },
    [Color.ColorB]: { name: 'Sapphire', class: 'bg-blue-500', hover: 'hover:shadow-blue-500/50', multiplier: '3.0x' },
    [Color.ColorC]: { name: 'Ruby', class: 'bg-rose-500', hover: 'hover:shadow-rose-500/50', multiplier: '6.0x' },
    [Color.ColorD]: { name: 'Amethyst', class: 'bg-purple-500', hover: 'hover:shadow-purple-500/50', multiplier: '6.0x' },
    [Color.ColorE]: { name: 'Amber', class: 'bg-amber-500', hover: 'hover:shadow-amber-500/50', multiplier: '9.0x' },
};

export const ColorTrading = () => {
    const { round, timeLeft, loading, error, placeBet, startGame, hasFetched, lastWin } = useColorTrading();
    const { isConnected, connect, owner } = useLineraWallet();
    const { tokenBalance } = usePulseToken();

    const [betAmount, setBetAmount] = useState<number>(10);
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const isBetting = round?.state === RoundState.Betting;
    const isRevealing = round?.state === RoundState.Revealing;
    const isCooldown = round?.state === RoundState.Cooldown;

    let statusText = 'Unknown Status';
    if (isBetting) {
        statusText = timeLeft === 0 ? 'Waiting for Result...' : 'Bidding Interval';
    } else if (isRevealing) {
        statusText = 'Revealing Result';
    } else if (isCooldown) {
        statusText = timeLeft === 0 ? 'Initializing Next Round...' : 'Cooldown';
    }

    const handleBet = async (color: Color) => {
        if (!isBetting) return;
        setSelectedColor(color);
        try {
            await placeBet(betAmount, color);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (e) {
        }
    };

    const userBets = round?.bets.filter(b => b.owner === owner) || [];

    if (!hasFetched) {
        return (
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
        );
    }

    if (!round) {
        return (
            <div className="h-[600px] flex items-center justify-center relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center max-w-md animate-fade-in">
                    <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl mb-4 rotate-12 group hover:rotate-0 transition-transform duration-500">
                        <Trophy className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Game Cycle Inactive</h2>
                        <p className="text-zinc-400 font-medium">To begin trading, the autonomous game loop needs to be initialized.</p>
                    </div>
                    <button
                        onClick={startGame}
                        disabled={loading}
                        className="bg-white text-black text-lg font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-white/10 flex items-center gap-3"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Initialize Cycle <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold max-w-xs break-words">
                            {error}
                        </div>
                    )}
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Powered by Linera Automation</p>
                </div>

                {
                    loading && (
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
                    )
                }
            </div >
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto p-4 lg:p-8 space-y-8 animate-fade-in relative">
            {/* Bet Success Overlay - Fluid Animation */}
            <AnimatePresence>
                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="bg-black px-8 py-5 rounded-full border border-zinc-800 shadow-2xl flex items-center gap-4 pointer-events-auto"
                        >
                            <div className="bg-white rounded-full p-1.5 shadow-lg shadow-white/20">
                                <Check className="w-5 h-5 text-black stroke-[3px]" />
                            </div>
                            <span className="font-bold text-white tracking-wide text-lg">Bet Placed Successfully</span>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* You Won Overlay */}
            <AnimatePresence>
                {lastWin && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-black/95 backdrop-blur-xl p-10 rounded-[2rem] border border-emerald-500/50 shadow-2xl text-center space-y-6 pointer-events-auto"
                        >
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Trophy className="w-20 h-20 text-emerald-500 mx-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            </motion.div>
                            <div>
                                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 italic tracking-tighter">YOU WON!</h2>
                                <p className="text-zinc-400 font-bold mt-2">Round #{round.roundId}</p>
                            </div>
                            <div className="bg-emerald-950/30 rounded-2xl p-6 border border-emerald-500/20">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Payout</p>
                                <p className="text-4xl font-mono font-black text-white shadow-emerald-500/20 drop-shadow-lg">
                                    +{(Number(lastWin.amount) * Number(COLOR_CONFIG[lastWin.color].multiplier.replace('x', ''))).toFixed(0)} PT
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 flex items-center justify-between group">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Timer className="w-3 h-3 text-white" /> Phase Status
                        </p>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {statusText}
                        </h3>
                    </div>
                    <div className="text-4xl font-mono font-black text-white bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800 shadow-inner">
                        {timeLeft}s
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3 text-white" /> Active Liquidity
                        </p>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {round?.bets.length || 0} Traders
                        </h3>
                    </div>
                    <div className="text-2xl font-mono font-bold text-zinc-400">
                        #{round?.roundId}
                    </div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="w-3 h-3 text-white" /> Last Reward
                        </p>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {round?.winningColor ? COLOR_CONFIG[round.winningColor].name : '--'}
                        </h3>
                    </div>
                    {round?.winningColor && (
                        <div className={`w-12 h-12 rounded-full ${COLOR_CONFIG[round.winningColor].class} shadow-lg animate-pulse`} />
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side: Betting Interface */}
                <div className="flex-1 space-y-8">
                    {/* Betting Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {(Object.keys(COLOR_CONFIG) as Color[]).map((color) => {
                            const config = COLOR_CONFIG[color];
                            const hasBetOnColor = userBets.some(b => b.color === color);
                            const isSelected = selectedColor === color || hasBetOnColor;
                            const isWinner = round?.winningColor === color && (isRevealing || isCooldown);

                            return (
                                <button
                                    key={color}
                                    disabled={!isBetting || loading || showSuccess}
                                    onClick={() => handleBet(color)}
                                    className={`
                                        relative group p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden
                                        ${isSelected ? 'scale-105 shadow-2xl z-10' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}
                                        ${isSelected ? config.class.replace('bg-', 'border-') : ''} 
                                        ${!isBetting && !isSelected ? 'opacity-40 grayscale' : ''}
                                        ${isWinner ? ' ring-4 ring-white ring-offset-4 ring-offset-zinc-950 animate-bounce' : ''}
                                    `}
                                    style={isSelected ? { borderColor: 'inherit' } : {}}
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${config.class} shadow-lg transition-transform group-hover:scale-110 group-active:scale-95 ${config.hover}`} />
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{config.name}</p>
                                        <p className="text-xl font-mono font-black text-white">{config.multiplier}</p>
                                    </div>

                                    {/* Overlay for Revealing State */}
                                    {isRevealing && !isWinner && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-grayscale flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-zinc-500 tracking-tighter uppercase opacity-50">Locked</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Interaction Panel */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800 space-y-6">
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="flex-1 space-y-3 w-full">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Injection Amount</label>
                                <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 flex items-center gap-4 group focus-within:border-zinc-600 transition-all">
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(Number(e.target.value))}
                                        disabled={!isBetting || loading || showSuccess}
                                        className="bg-transparent text-2xl font-mono font-bold text-white outline-none w-full"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setBetAmount(prev => prev / 2)}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                                        >1/2</button>
                                        <button
                                            onClick={() => setBetAmount(prev => prev * 2)}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                                        >2x</button>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                {!isConnected ? (
                                    <button onClick={connect} className="bg-white text-black font-black px-12 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/10">
                                        Initialize Wallet
                                    </button>
                                ) : (
                                    <div className="bg-zinc-950 border border-zinc-800 px-8 py-5 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Liquidity Pool</span>
                                        <span className="text-xl font-mono font-bold text-white">{tokenBalance} PT</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Probability & Risk Legend */}
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Winning Odds
                                </span>
                            </div>

                            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 space-y-4">
                                <div className="space-y-3">
                                    {/* 3x Tier */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-zinc-900 shadow-lg" />
                                                <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-zinc-900 shadow-lg" />
                                            </div>
                                            <span className="text-zinc-400 font-medium">3.0x Multiplier</span>
                                        </div>
                                        <span className="font-bold text-emerald-500">30% <span className="text-zinc-600 font-normal">Probability</span></span>
                                    </div>

                                    {/* 6x Tier */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-4 h-4 rounded-full bg-rose-500 ring-2 ring-zinc-900 shadow-lg" />
                                                <div className="w-4 h-4 rounded-full bg-purple-500 ring-2 ring-zinc-900 shadow-lg" />
                                            </div>
                                            <span className="text-zinc-400 font-medium">6.0x Multiplier</span>
                                        </div>
                                        <span className="font-bold text-amber-500">15% <span className="text-zinc-600 font-normal">Probability</span></span>
                                    </div>

                                    {/* 9x Tier */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-4 h-4 rounded-full bg-amber-500 ring-2 ring-zinc-900 shadow-lg" />
                                            </div>
                                            <span className="text-zinc-400 font-medium">9.0x Multiplier</span>
                                        </div>
                                        <span className="font-bold text-rose-500">10% <span className="text-zinc-600 font-normal">Probability</span></span>
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-800/50" />

                                <p className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                    High Risk • High Reward
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold flex items-center gap-3">
                                <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                                {error}
                            </div>
                        )}

                        {userBets.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Active Positions</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {userBets.map((bet, idx) => (
                                        <div key={idx} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-4 h-4 rounded-full ${COLOR_CONFIG[bet.color].class}`} />
                                                <div>
                                                    <p className="text-white font-mono font-bold">{bet.amount} PT on {COLOR_CONFIG[bet.color].name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-mono font-bold text-zinc-400">
                                                    Potential: <span className="text-emerald-500">{(Number(bet.amount) * Number(COLOR_CONFIG[bet.color].multiplier.replace('x', ''))).toFixed(2)} PT</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Feed/History */}
                <div className="w-full lg:w-[320px] space-y-6">
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-800 overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4" /> Global Feed
                            </h4>
                            <span className="bg-emerald-500/20 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">Live Sync</span>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[400px] scrollbar-hide">
                            {round?.bets.slice(0, 10).map((bet, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${COLOR_CONFIG[bet.color].class}`} />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
                                                {bet.owner.slice(0, 6)}...{bet.owner.slice(-4)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-mono font-bold text-white">{bet.amount} PT</p>
                                    </div>
                                </div>
                            ))}
                            {(!round?.bets || round.bets.length === 0) && (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50">
                                    <ArrowRight className="w-8 h-8 rotate-90" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for nodes...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
        </div>
    );
};
