import { useState } from 'react';
import { useLineraWallet } from '../hooks/useLineraWallet';
import { Coins, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export function Faucets() {
    const { isConnected, chainId, balance, isReady, requestFaucet } = useLineraWallet();
    const [amount, setAmount] = useState('10'); // Default to 10 as that's typical testnet grant
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async () => {
        if (!requestFaucet) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await requestFaucet();
            setSuccess("Faucet request successful! New chain claimed with initial funds.");
        } catch (err: any) {
            setError(err.message || 'Failed to request funds');
        } finally {
            setLoading(false);
        }
    };

    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="animate-spin mr-2" /> Initializing Linera Core...
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="bg-blue-500/10 p-4 rounded-full mb-6">
                    <Coins className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect to Access Faucet</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Connect your MetaMask wallet to initialize your Linera chain and receive testnet tokens.
                </p>
            </div>
        );
    }

    const explorerLink = chainId ? `https://explorer.testnet-conway.linera.net/chains/${chainId}` : '#';

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-500/10 p-3 rounded-xl">
                    <Coins className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Testnet Faucet</h1>
                    <p className="text-gray-400 mt-1">Manage your Linera Testnet funds</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                        <span className="text-xs font-mono text-gray-400">TESTNET</span>
                    </div>

                    <h3 className="text-gray-400 font-medium mb-2">Current Balance</h3>
                    <div className="text-4xl font-bold text-white mb-4 flex items-baseline gap-2">
                        {balance || '0.00'}
                        <span className="text-lg text-[#3B82F6] font-medium">BUILD</span>
                    </div>

                    <div className="mt-6 p-4 bg-[#0F172A] rounded-xl border border-[#334155/50]">
                        <div className="text-sm text-gray-500 mb-1">Chain ID</div>
                        <div className="font-mono text-sm text-gray-300 break-all select-all flex items-center justify-between gap-2">
                            {chainId}
                        </div>
                        <a
                            href={explorerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1"
                        >
                            View in Explorer <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Request Card */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-6">Add Funds</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Amount (BUILD)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                            />
                        </div>

                        <button
                            onClick={handleRequest}
                            disabled={loading || !amount}
                            className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${loading
                                    ? 'bg-blue-500/10 text-blue-400 cursor-not-allowed'
                                    : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Coins className="w-5 h-5" />
                                    Request Funds
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                <Coins className="w-5 h-5 text-green-400" />
                                <p className="text-sm text-green-400">{success}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
