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
                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                                    Injection Amount
                                </label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={stakeAmount}
                                        onChange={(e) => setStakeAmount(e.target.value)}
                                        min="1"
                                        className="w-full bg-zinc-900/50 text-4xl font-light text-white border-b-2 border-zinc-800 focus:border-white outline-none py-4 transition-all placeholder-zinc-800 font-mono"
                                        placeholder="0"
                                        disabled={loading}
                                    />
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-zinc-600 font-medium">
                                        PT
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Yield Structure</span>
                                    <span className="text-white font-mono opacity-50">v1.0</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs py-2 border-b border-zinc-900">
                                        <span className="text-zinc-400">Perfect Run (6 Turns)</span>
                                        <span className="font-mono text-white">20x</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-2 border-b border-zinc-900">
                                        <span className="text-zinc-500">Optimal (7-8 Turns)</span>
                                        <span className="font-mono text-zinc-300">5x</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-2 border-b border-zinc-900">
                                        <span className="text-zinc-600">Standard (9-10 Turns)</span>
                                        <span className="font-mono text-zinc-500">3x</span>
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
