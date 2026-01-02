import { useState } from 'react';
import { Coins, Zap } from 'lucide-react';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';

export default function Faucets() {
    const { balance, owner, requestFaucet } = useLineraWallet();
    const { tokenBalance, mint, isReady } = usePulseToken();
    const [loading, setLoading] = useState(false);
    const [tokenMintAmount, setTokenMintAmount] = useState('100');

    const handleFaucetRequest = async () => {
        setLoading(true);
        try {
            await requestFaucet();
        } catch (error) {
            console.error("Faucet request failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTokenMint = async () => {
        setLoading(true);
        try {
            await mint(tokenMintAmount);
        } catch (error) {
            console.error("Token mint failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center font-sans antialiased text-white selection:bg-white selection:text-black">
            <div className="max-w-5xl w-full p-6 space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">Testnet Resources</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">
                            Asset Faucets.
                        </h1>
                        <p className="text-lg text-zinc-500 max-w-md leading-relaxed">
                            Request testnet liquidity. Mint PulseTokens for protocol interaction.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* Linera Faucet Card */}
                    <div className="group relative bg-zinc-900 rounded-3xl p-1 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

                        <div className="h-full bg-black rounded-[20px] p-8 flex flex-col justify-between relative z-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                        <Coins className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Linera Native</h2>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">L1 Blockchain</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Current Balance</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tight">
                                        {balance || '0'} <span className="text-lg text-zinc-600">LINERA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PulseToken Faucet Card */}
                    <div className="group relative bg-zinc-900 rounded-3xl p-1 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

                        <div className="h-full bg-black rounded-[20px] p-8 flex flex-col justify-between relative z-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                        <Coins className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">PulseToken</h2>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Protocol Utility</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Token Balance</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tight">
                                        {tokenBalance || '0'} <span className="text-lg text-zinc-600">PULSE</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Mint Allocation</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={tokenMintAmount}
                                            onChange={(e) => setTokenMintAmount(e.target.value)}
                                            className="w-full bg-zinc-900/50 text-white font-mono border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors"
                                            placeholder="0"
                                            min="1"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold">PT</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTokenMint}
                                    disabled={loading || !isReady || !tokenMintAmount}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-zinc-700"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">MINTING...</span>
                                    ) : (
                                        <>
                                            MINT TOKENS
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {!owner && (
                    <div className="flex items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-500 text-sm">
                        <span className="w-2 h-2 bg-yellow-500/50 rounded-full animate-pulse"></span>
                        Wallet connection required for interaction
                    </div>
                )}
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
}
