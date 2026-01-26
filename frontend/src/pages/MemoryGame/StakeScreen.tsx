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
        { label: 'Perfect Run', turns: '6 Turns', multiplier: '20x', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
        { label: 'Optimal', turns: '7-8 Turns', multiplier: '5x', color: 'blue', bg: 'bg-blue-500/5', border: 'border-blue-500/10', text: 'text-blue-400' },
        { label: 'Standard', turns: '9-10 Turns', multiplier: '3x', color: 'zinc', bg: 'bg-zinc-500/5', border: 'border-zinc-500/10', text: 'text-zinc-400' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans antialiased selection:bg-white selection:text-black overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-purple-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="fixed inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            <div className="max-w-[1400px] w-full p-6 md:p-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">

                    {/* Left Column: Brand & Context (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Memory Protocol V1</span>
                            </div>
                            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white leading-[0.85]">
                                TOTAL<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">RECALL.</span>
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-md leading-relaxed font-light">
                                Prove your cognitive retention in a decentralized environment. Match pairs with minimal entropy to maximize your yield.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <Brain className="w-5 h-5 text-zinc-500" />
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Grid Size</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">6 <span className="text-sm text-zinc-600 font-sans">Pairs</span></div>
                            </div>
                            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <Zap className="w-5 h-5 text-emerald-500" />
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Max Yield</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">20.0x</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interaction Panel (8 cols) */}
                    <div className="lg:col-span-8">
                        <div className="bg-zinc-900/30 backdrop-blur-xl rounded-[2rem] border border-zinc-800 p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

                            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">

                                {/* Top Row: Input & Potential */}
                                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 bg-white rounded-full"></div>
                                            Injection Amount
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                min="1"
                                                className="w-full bg-black/50 text-6xl font-black text-white border-b-2 border-zinc-800 focus:border-white outline-none py-4 px-2 transition-all placeholder-zinc-800 font-mono tracking-tighter"
                                                placeholder="0"
                                                disabled={loading}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-600 tracking-widest">PT</span>
                                        </div>
                                    </div>

                                    <div className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Potential Return</span>
                                            <Target className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-mono text-zinc-500 mb-1">20x Multiplier</div>
                                            <div className="text-4xl lg:text-5xl font-mono font-black text-white tracking-tighter">
                                                {parseInt(stakeAmount) > 0 ? (parseInt(stakeAmount) * 20).toLocaleString() : '0'} <span className="text-lg text-zinc-600">PT</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

                                {/* Prizepool Grid */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Payout Structure</h3>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                            <Info className="w-3 h-3" /> Fewer Turns = Higher Multiplier
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tiers.map((tier, idx) => (
                                            <div key={idx} className={`relative group p-5 rounded-2xl border ${tier.border} ${tier.bg} hover:bg-opacity-20 transition-all flex flex-col justify-between min-h-[140px] overflow-hidden`}>
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" style={{ color: `var(--${tier.color}-500)` }}></div>

                                                <div className="flex justify-between items-start">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tier.text} bg-black/40 px-2 py-1 rounded-md border border-white/5`}>
                                                        {tier.multiplier}
                                                    </span>
                                                    {idx === 0 && <Trophy className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                                                </div>

                                                <div>
                                                    <div className="text-lg font-bold text-white mb-1">{tier.label}</div>
                                                    <div className="text-xs text-zinc-400 font-mono">{tier.turns}</div>
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
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                                    <div className="relative flex items-center justify-center gap-4">
                                        <span className="text-xl font-black tracking-widest uppercase">
                                            {loading ? 'INITIALIZING...' : 'INITIATE PROTOCOL'}
                                        </span>
                                        {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
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
