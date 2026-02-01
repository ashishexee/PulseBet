import { useState } from 'react';
import { ArrowRight, Brain, Zap, Target, Trophy, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePulseToken } from '../../hooks/usePulseToken';

interface StakeScreenProps {
    onCreateGame: (stake: number) => Promise<void>;
    loading: boolean;
}

export const StakeScreen = ({ onCreateGame, loading }: StakeScreenProps) => {
    const { tokenBalance } = usePulseToken();
    const navigate = useNavigate();
    const [stakeAmount, setStakeAmount] = useState('10');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(stakeAmount);

        if (amount <= 0) {
            toast.error("Invalid Stake", { description: "Please enter a stake amount greater than 0." });
            return;
        }

        const currentBalance = parseFloat(tokenBalance || '0');
        if (amount > currentBalance) {
            toast.error("Insufficient Funds", {
                description: "You don't have enough PulseTokens for this stake.",
                action: {
                    label: "Mint Tokens",
                    onClick: () => navigate('/mining/faucets')
                },
                cancel: {
                    label: "Cancel",
                    onClick: () => { }
                },
                duration: 5000,
            });
            return;
        }

        if (amount > 0) {
            await onCreateGame(amount);
        }
    };

    const tiers = [
        { label: 'Perfect Run', turns: '6 Turns', multiplier: '20x', bg: 'bg-zinc-50,0', border: 'border-zinc-800' },
        { label: 'Optimal', turns: '7-8 Turns', multiplier: '5x', bg: 'bg-zinc-900', border: 'border-zinc-800' },
        { label: 'Standard', turns: '9-10 Turns', multiplier: '3x', bg: 'bg-zinc-900', border: 'border-zinc-800' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans antialiased selection:bg-white selection:text-black overflow-hidden relative">
            {/* Grain & Ambient - Monochrome Only */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-50%] right-[-20%] w-[1000px] h-[1000px] bg-white/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-[1200px] w-full p-6 relative z-10">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

                    {/* Left Column: Brand & Context */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
                                <span className="text-[10px] font-bold text-zinc-300 tracking-[0.2em] uppercase">System Verified</span>
                            </div>

                            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.85]">
                                MEMORY<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-400 to-zinc-800">GAME.</span>
                            </h1>

                            <p className="text-base text-zinc-500 max-w-sm leading-relaxed font-light tracking-wide border-l border-zinc-800 pl-4">
                                Match pairs with zero entropy.<br />
                                <span className="text-zinc-300 font-medium">Clear grid. Claim yield.</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 backdrop-blur-sm group hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Grid</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">6 <span className="text-xs text-zinc-600 font-sans tracking-normal">Pairs</span></div>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 backdrop-blur-sm group hover:bg-zinc-900/50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Max</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white tracking-tighter">20.0x</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interaction Panel */}
                    <div className="lg:col-span-7">
                        <div className="bg-zinc-950 rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                            {/* Subtle scanline effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 opacity-20 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>

                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                                {/* Top Row: Input & Potential */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            Injection Amount
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                min="1"
                                                className="w-full bg-transparent text-6xl font-black text-white border-b-2 border-zinc-800 focus:border-white outline-none py-2 transition-all placeholder-zinc-800 font-sans tracking-tighter"
                                                placeholder="0"
                                                disabled={loading}
                                            />
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-700 tracking-widest font-mono">PT</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Return</span>
                                            <Target className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white text-black text-[9px] font-bold uppercase tracking-widest mb-1">
                                                20x
                                            </div>
                                            <div className="text-3xl lg:text-4xl font-mono font-bold text-white tracking-tighter">
                                                {parseInt(stakeAmount) > 0 ? (parseInt(stakeAmount) * 20).toLocaleString() : '0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Prizepool Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Efficiency Protocol</h3>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                            <Info className="w-3 h-3" /> Lower Turns = Higher Yield
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className={`relative group p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-all flex flex-col justify-between min-h-[120px]`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/10 px-2 py-1 rounded border border-white/10`}>
                                                        {tier.multiplier}
                                                    </span>
                                                    {idx === 0 && <Trophy className="w-4 h-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                                                </div>

                                                <div>
                                                    <div className="text-sm font-bold text-zinc-300 mb-1 tracking-wide">{tier.label}</div>
                                                    <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">{tier.turns}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !stakeAmount || parseInt(stakeAmount) <= 0}
                                    className="w-full group relative overflow-hidden bg-white hover:bg-zinc-200 text-black p-6 rounded-2xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                                    <div className="relative flex items-center justify-center gap-4">
                                        <span className="text-lg font-black tracking-[0.2em] uppercase">
                                            {loading ? 'INITIALIZING...' : 'INITIATE RECALL'}
                                        </span>
                                        {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                    </div>
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
