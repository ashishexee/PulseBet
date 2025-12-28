import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface StakeScreenProps {
    onCreateGame: (stake: number) => Promise<void>;
    loading: boolean;
}

export const StakeScreen = ({ onCreateGame, loading }: StakeScreenProps) => {
    const [stakeAmount, setStakeAmount] = useState('10');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(stakeAmount);
        if (amount > 0) {
            await onCreateGame(amount);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans antialiased selection:bg-white selection:text-black">
            {/* Subtle background noise/grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-12 p-8 md:p-12 z-10">
                {/* Left: Branding & Info */}
                <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">Live Testnet</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">
                            Memory<br />Protocol.
                        </h1>
                        <p className="text-lg text-zinc-500 max-w-sm leading-relaxed">
                            A decentralized test of cognitive retention.
                            Match pairs. Minimize entropy. Maximise yield.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm">
                            <div className="text-2xl font-semibold">6</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Pairs</div>
                        </div>
                        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm">
                            <div className="text-2xl font-semibold">20x</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Max Yield</div>
                        </div>
                    </div>
                </div>

                {/* Right: Interaction */}
                <div className="w-full md:w-[400px]">
                    <div className="bg-black rounded-3xl p-8 border border-zinc-800 shadow-2xl shadow-zinc-950/50 relative overflow-hidden">
                        {/* Gradient Border Hint */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                        Injection Amount
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            min="1"
                                            className="w-full bg-zinc-900 text-5xl font-medium text-white border-2 border-zinc-800 focus:border-white focus:ring-4 focus:ring-zinc-800 outline-none py-6 px-4 rounded-xl transition-all placeholder-zinc-700 font-mono shadow-inner"
                                            placeholder="0"
                                            disabled={loading}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-500">
                                            PT
                                        </span>
                                    </div>

                                    {/* Dynamic Yield Calculator */}
                                    {parseInt(stakeAmount) > 0 && (
                                        <div className="flex items-center justify-between px-2 text-sm animate-fade-in">
                                            <span className="text-zinc-500">Potential Return (20x)</span>
                                            <span className="font-mono font-bold text-green-400">
                                                {(parseInt(stakeAmount) * 20).toLocaleString()} PT
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-zinc-900">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Prizepool Structure</span>
                                </div>

                                <div className="space-y-3">
                                    {/* Perfect Run */}
                                    <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900 border border-emerald-500/30 group hover:border-emerald-500/50 transition-all">
                                        <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 blur-[30px] rounded-full"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-lg">Perfect Run</span>
                                                <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">6 Turns</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                                                    20x
                                                </div>
                                                {parseInt(stakeAmount) > 0 && (
                                                    <div className="text-emerald-500 font-mono text-xs font-bold">
                                                        = {(parseInt(stakeAmount) * 20).toLocaleString()} PT
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optimal */}
                                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-300 font-bold">Optimal</span>
                                            <span className="text-zinc-600 text-xs uppercase tracking-wider font-bold">7-8 Turns</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-xl font-bold text-white">5x</div>
                                            {parseInt(stakeAmount) > 0 && (
                                                <div className="text-zinc-500 font-mono text-xs">
                                                    = {(parseInt(stakeAmount) * 5).toLocaleString()} PT
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Standard */}
                                    <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-400 font-medium">Standard</span>
                                            <span className="text-zinc-700 text-xs uppercase tracking-wider font-bold">9-10 Turns</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-xl font-bold text-zinc-400">3x</div>
                                            {parseInt(stakeAmount) > 0 && (
                                                <div className="text-zinc-600 font-mono text-xs">
                                                    = {(parseInt(stakeAmount) * 3).toLocaleString()} PT
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !stakeAmount || parseInt(stakeAmount) <= 0}
                                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="animate-pulse">INITIALIZING...</span>
                                ) : (
                                    <>
                                        INITIATE PROTOCOL <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
