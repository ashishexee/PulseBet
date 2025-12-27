import { Trophy, Repeat, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultScreenProps {
    gameState: {
        turnCount: number;
        stakeAmount: number;
        payoutMultiplier: number | null;
        state: string;
    };
    onClaimPayout: () => Promise<void>;
    onPlayAgain: () => void;
    loading: boolean;
}

export const ResultScreen = ({ gameState, onClaimPayout, onPlayAgain, loading }: ResultScreenProps) => {
    const multiplier = gameState.payoutMultiplier || 0;
    const payout = gameState.stakeAmount * multiplier;
    const isWin = multiplier > 0;
    const isClaimed = gameState.state === 'CLAIMED';

    const getPerformance = (turns: number) => {
        if (turns === 6) return { label: 'PERFECT!', color: 'from-green-400 to-emerald-500', emoji: '🏆' };
        if (turns <= 8) return { label: 'Excellent!', color: 'from-blue-400 to-cyan-500', emoji: '⭐' };
        if (turns <= 10) return { label: 'Good!', color: 'from-yellow-400 to-orange-500', emoji: '👍' };
        if (turns <= 12) return { label: 'Close!', color: 'from-orange-400 to-red-500', emoji: '🎯' };
        return { label: 'Better luck next time', color: 'from-gray-400 to-gray-600', emoji: '😢' };
    };

    const performance = getPerformance(gameState.turnCount);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f212e]/90 backdrop-blur-sm p-4 font-sans antialiased animate-in fade-in zoom-in duration-300 relative z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-lg w-full"
            >
                {/* Result Card */}
                <div className="bg-[#213545] rounded-3xl p-8 border border-[#2f4553] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative overflow-hidden">
                    {/* Internal Lighting Effect */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <motion.div
                            className="text-8xl mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            {performance.emoji}
                        </motion.div>
                        <h1 className={`text-4xl font-black mb-2 tracking-tight ${isWin ? 'text-[var(--success-green)] drop-shadow-[0_0_15px_rgba(0,231,1,0.4)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            }`}>
                            {performance.label.toUpperCase()}
                        </h1>
                        <p className="text-[#b1bad3] font-medium text-lg">
                            Completed in <span className="text-white font-bold">{gameState.turnCount}</span> turns
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-[#0f212e]/50 rounded-xl p-4 text-center border border-[#2f4553]">
                            <div className="text-[#8a9db5] text-[10px] font-extrabold uppercase tracking-wider mb-1">Turns</div>
                            <div className="text-2xl font-black text-white">{gameState.turnCount}</div>
                        </div>
                        <div className="bg-[#0f212e]/50 rounded-xl p-4 text-center border border-[#2f4553]">
                            <div className="text-[#8a9db5] text-[10px] font-extrabold uppercase tracking-wider mb-1">Multiplier</div>
                            <div className={`text-2xl font-black ${isWin ? 'text-[var(--primary-blue)]' : 'text-[#b1bad3]'}`}>
                                {multiplier}x
                            </div>
                        </div>
                    </div>

                    {/* Payout Section */}
                    {isWin ? (
                        <div className="bg-[#071824] rounded-2xl p-6 mb-6 text-center border border-[#00e701]/30 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#00e701]/5 group-hover:bg-[#00e701]/10 transition-colors"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                    <div className="text-[var(--success-green)] font-bold uppercase tracking-wider text-sm">Win Amount</div>
                                </div>
                                <div className="text-4xl font-black text-white tracking-tight mb-1">{payout}</div>
                                <div className="text-[#b1bad3] text-sm font-mono">PulseTokens</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#071824] rounded-2xl p-6 mb-6 text-center border border-red-500/30 relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/5"></div>
                            <div className="relative z-10">
                                <div className="text-[#b1bad3] font-bold uppercase tracking-wider text-sm mb-2">Result</div>
                                <div className="text-3xl font-black text-white mb-1">No Payout</div>
                                <div className="text-red-400 text-sm font-medium">Exceeded 12 turns limit</div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {isWin && !isClaimed && (
                            <button
                                onClick={onClaimPayout}
                                disabled={loading}
                                className="w-full bg-gradient-to-br from-[#00e701] to-[#00a801] hover:brightness-110 text-[#0f212e] font-black py-4 rounded-xl shadow-[0_6px_0_#008f00,_0_15px_20px_-5px_rgba(0,231,1,0.4)] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 text-lg"
                            >
                                {loading ? (
                                    'Claiming...'
                                ) : (
                                    <>
                                        <Coins className="w-5 h-5" />
                                        CLAIM PAYOUT
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={onPlayAgain}
                            disabled={loading}
                            className={`w-full ${isWin && !isClaimed ? 'bg-[#2f4553] text-[#b1bad3] hover:text-white hover:bg-[#3c5566]' : 'bg-gradient-to-br from-[var(--primary-blue)] to-blue-700 text-white shadow-[0_6px_0_#005a9e,_0_15px_20px_-5px_rgba(0,90,158,0.4)] hover:brightness-110'} font-black py-4 rounded-xl active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2 text-sm shadow-[0_4px_0_rgba(0,0,0,0.2)]`}
                        >
                            <Repeat className="w-4 h-4" />
                            {isWin && !isClaimed ? 'Play Again Later' : 'PLAY AGAIN'}
                        </button>
                    </div>

                    {isClaimed && (
                        <div className="mt-4 text-center text-[var(--success-green)] font-bold text-sm bg-[#00e701]/10 py-2 rounded-lg border border-[#00e701]/20">
                            ✓ Payout claimed to wallet
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
