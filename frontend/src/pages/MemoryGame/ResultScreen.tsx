import { Trophy, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultScreenProps {
    gameState: {
        turnCount: number;
        stakeAmount: number;
        potentialPayout: number;
        state: string;
    };
    onClaimPayout: () => Promise<void>;
    onPlayAgain: () => void;
    loading: boolean;
}

export const ResultScreen = ({ gameState, onClaimPayout, onPlayAgain, loading }: ResultScreenProps) => {
    const payout = gameState.potentialPayout || 0;
    const multiplier = gameState.stakeAmount > 0 ? payout / gameState.stakeAmount : 0;
    const isWin = payout > 0;
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans antialiased text-white relative z-50 selection:bg-white selection:text-black">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="max-w-md w-full"
            >
                <div className="bg-black rounded-3xl p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                    <div className="relative z-10 text-center space-y-8">

                        {/* Status Icon */}
                        <div className="flex justify-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${isWin ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                                {isWin ? <Trophy className="w-10 h-10" /> : <div className="text-4xl">✕</div>}
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tighter text-white">
                                {isWin ? 'YIELD GENERATED' : 'PROTOCOL FAILED'}
                            </h1>
                            <p className="text-zinc-500 font-medium">
                                {performance.label} • {gameState.turnCount} Turns
                            </p>
                        </div>

                        {/* Stats Detail */}
                        <div className="grid grid-cols-2 gap-px bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                            <div className="bg-black p-4">
                                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Turns</div>
                                <div className="text-2xl font-mono text-white mt-1">{gameState.turnCount}</div>
                            </div>
                            <div className="bg-black p-4">
                                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Yield Multiplier</div>
                                <div className={`text-2xl font-mono mt-1 ${isWin ? 'text-white' : 'text-zinc-600'}`}>{multiplier}x</div>
                            </div>
                        </div>

                        {/* Payout Display */}
                        {isWin ? (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">Total Allocation</div>
                                <div className="text-5xl font-bold tracking-tighter text-white font-mono">
                                    {payout}
                                </div>
                                <div className="text-xs text-zinc-600 mt-2 font-mono">PULSE TOKENS</div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 opacity-50">
                                <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">Total Allocation</div>
                                <div className="text-3xl font-bold tracking-tighter text-zinc-500 font-mono">
                                    0 PT
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3 pt-4">
                            {isWin && !isClaimed && (
                                <button
                                    onClick={onClaimPayout}
                                    disabled={loading}
                                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                                >
                                    {loading ? 'PROCESSING...' : 'CLAIM REWARD'}
                                </button>
                            )}

                            <button
                                onClick={onPlayAgain}
                                disabled={loading}
                                className={`w-full font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] uppercase tracking-wider text-sm flex items-center justify-center gap-2 border ${isWin && !isClaimed ? 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-black border-transparent hover:bg-zinc-200'}`}
                            >
                                <Repeat className="w-4 h-4" />
                                {isWin && !isClaimed ? 'Ignore & Restart' : 'Re-Initiate Protocol'}
                            </button>
                        </div>

                        {isClaimed && (
                            <div className="text-xs text-zinc-500 flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Funds transferred to wallet
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </div>
    );
};
