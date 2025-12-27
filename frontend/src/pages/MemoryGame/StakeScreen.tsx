import { useState } from 'react';
import { ArrowRight, Coins } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-[#1a2c38] p-4 font-sans antialiased text-white animate-fade-in">
            <div className="max-w-[1000px] w-full flex flex-col items-center gap-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight">
                        MEMORY <span className="text-[var(--primary-blue)]">MATCH</span>
                    </h1>
                    <p className="text-[#b1bad3] font-medium text-lg">
                        Find the pairs. Beat the clock.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-stretch">

                    {/* Control Panel (Betting) */}
                    <div className="w-full md:w-[380px] bg-[#213545] rounded-2xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 relative overflow-hidden group">
                        {/* Internal Lighting Effect */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full">
                            {/* Input Field */}
                            <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex flex-col gap-2 relative transition-all duration-300 hover:border-[#557086] hover:bg-[#0f212e]/70 focus-within:border-[var(--primary-blue)] focus-within:shadow-[0_0_0_3px_rgba(20,117,225,0.2)] shadow-inner">
                                <label className="text-[11px] font-extrabold text-[#8a9db5] pl-1 uppercase tracking-wider flex items-center gap-1">
                                    Stake Amount
                                    <span className="w-1 h-1 rounded-full bg-[var(--primary-blue)]"></span>
                                </label>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-3 flex-1 bg-[#071824] rounded-lg px-3 py-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                                        <Coins className="w-5 h-5 text-[var(--primary-blue)] drop-shadow-[0_0_8px_rgba(20,117,225,0.5)]" />
                                        <input
                                            type="number"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            min="1"
                                            className="bg-transparent text-white font-black text-xl w-full outline-none placeholder-[#2f4553] font-mono tracking-tight"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Multiplier Info Panel */}
                            <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex-1 flex flex-col relative shadow-inner">
                                <label className="text-[11px] font-extrabold text-[#8a9db5] mb-3 uppercase tracking-wider flex items-center gap-1">
                                    Payout Structure
                                </label>

                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    <div className="bg-[#071824] rounded-lg p-3 border border-[#2f4553]/30 flex flex-col items-center justify-center shadow-sm hover:border-[#2f4553] transition-colors">
                                        <div className="text-[var(--success-green)] text-xl font-black font-mono">20x</div>
                                        <div className="text-[#8a9db5] text-[10px] font-bold uppercase mt-1">6 Turns</div>
                                    </div>
                                    <div className="bg-[#071824] rounded-lg p-3 border border-[#2f4553]/30 flex flex-col items-center justify-center shadow-sm hover:border-[#2f4553] transition-colors">
                                        <div className="text-[var(--primary-blue)] text-xl font-black font-mono">5x</div>
                                        <div className="text-[#8a9db5] text-[10px] font-bold uppercase mt-1">7-8 Turns</div>
                                    </div>
                                    <div className="bg-[#071824] rounded-lg p-3 border border-[#2f4553]/30 flex flex-col items-center justify-center shadow-sm hover:border-[#2f4553] transition-colors">
                                        <div className="text-yellow-400 text-xl font-black font-mono">3x</div>
                                        <div className="text-[#8a9db5] text-[10px] font-bold uppercase mt-1">9-10 Turns</div>
                                    </div>
                                    <div className="bg-[#071824] rounded-lg p-3 border border-[#2f4553]/30 flex flex-col items-center justify-center shadow-sm hover:border-[#2f4553] transition-colors">
                                        <div className="text-orange-400 text-xl font-black font-mono">1.5x</div>
                                        <div className="text-[#8a9db5] text-[10px] font-bold uppercase mt-1">11-12 Turns</div>
                                    </div>
                                </div>

                                <div className="mt-3 text-center">
                                    <span className="text-[10px] font-bold text-red-500/80 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-wide">
                                        &gt; 12 Turns = Loss
                                    </span>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                type="submit"
                                disabled={loading || !stakeAmount || parseInt(stakeAmount) <= 0}
                                className="w-full bg-gradient-to-br from-[var(--primary-blue)] to-blue-700 hover:brightness-110 text-white font-black py-4 rounded-xl shadow-[0_6px_0_#005a9e,_0_15px_20px_-5px_rgba(0,90,158,0.4)] active:shadow-none active:translate-y-[6px] transition-all transform hover:scale-[1.01] disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                            >
                                {loading ? "STARTING..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        START GAME <ArrowRight className="w-4 h-4 ml-1" />
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Info / Decorative Panel (Right Side to fill space) */}
                    <div className="hidden md:flex flex-1 bg-[#0f212e] rounded-2xl p-8 items-center justify-center border border-[#2f4553]/50 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        <div className="text-center z-10 max-w-xs">
                            <div className="w-24 h-24 bg-[#213545] rounded-xl mx-auto mb-6 shadow-[0_10px_0_#1a2c38] border border-[#2f4553] flex items-center justify-center rotate-3 transform hover:rotate-6 transition-transform duration-500">
                                <span className="text-4xl">🎴</span>
                            </div>
                            <h3 className="text-white font-black text-xl mb-2">12 CARDS • 6 PAIRS</h3>
                            <p className="text-[#8a9db5] text-sm leading-relaxed">
                                Test your memory and speed. Match all pairs as fast as possible to maximize your multiplier.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
