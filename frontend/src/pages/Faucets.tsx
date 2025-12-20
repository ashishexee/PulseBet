// import { useState } from 'react';
import { useLineraWallet } from '../hooks/useLineraWallet';
// import { usePulseToken } from '../hooks/usePulseToken';
import { Coins, Loader2 } from 'lucide-react';

export function Faucets() {
    const { isConnected, isConnecting, isReady: isWalletReady } = useLineraWallet();
    // const { mint, tokenBalance, appId, isReady: isTokenReady } = usePulseToken();

    // const [amount, setAmount] = useState('1000');
    // const [loading, setLoading] = useState(false);
    // const [success, setSuccess] = useState<string | null>(null);
    // const [error, setError] = useState<string | null>(null);

    // const handleRequest = async () => {
    //     if (!isTokenReady) return;
    //     setLoading(true);
    //     setError(null);
    //     setSuccess(null);

    //     try {
    //         await mint(amount);
    //         setSuccess(`Successfully minted ${amount} PulseTokens!`);
    //     } catch (err: any) {
    //         setError(err.message || 'Failed to mint tokens');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    if (!isWalletReady || isConnecting) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="animate-spin mr-2" />
                {isConnecting ? "Setting up Secure Wallet..." : "Initializing Linera Core..."}
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="bg-blue-500/10 p-4 rounded-full mb-6">
                    <Coins className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Connect your wallet to view your native Linera balance.
                </p>
            </div>
        );
    }

    // if (!appId) {
    //     return (
    //         <div className="flex flex-col items-center justify-center p-8 text-center text-red-400">
    //             <AlertCircle className="w-8 h-8 mb-2" />
    //             <div>Error: PulseToken App ID not found in .env</div>
    //         </div>
    //     )
    // }

    // Check explicit states for UI feedback
    // const isSyncing = isConnected && !isTokenReady; // Connected but token logic not ready
    // const isFetching = isTokenReady && !tokenBalance; // Ready but balance pending

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-500/10 p-3 rounded-xl">
                    <Coins className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Faucet</h1>
                    <p className="text-gray-400 mt-1">Using native Linera balance (100 default)</p>
                </div>
            </div>

            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 text-center">
                <div className="bg-green-500/10 p-4 rounded-full inline-block mb-4">
                    <Coins className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Native Balance Active</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                    Your wallet is using the native Linera balance (100 default). Custom token faucet is currently disabled.
                </p>
            </div>

            {/* PulseToken UI Hidden - Code preserved for future use */}
            {/* 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                        <span className="text-xs font-mono text-pink-400">CUSTOM TOKEN</span>
                    </div>

                    <h3 className="text-gray-400 font-medium mb-2">Your Balance</h3>
                    <div className="text-4xl font-bold text-white mb-4 flex items-baseline gap-2">
                        {tokenBalance ?? <span className="animate-pulse text-gray-600">...</span>}
                        <span className="text-lg text-pink-500 font-medium">PULSE</span>
                    </div>

                    <div className="mt-6 p-4 bg-[#0F172A] rounded-xl border border-[#334155/50]">
                        <div className="text-xs text-gray-500 mb-1">Token App ID</div>
                        <div className="font-mono text-xs text-gray-500 break-all select-all">
                            {appId}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-6">Mint Tokens</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Amount (PULSE)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all font-mono"
                            />
                        </div>

                        <button
                            onClick={handleRequest}
                            disabled={loading || !amount || isSyncing || isFetching}
                            className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${(loading || isSyncing || isFetching)
                                    ? 'bg-pink-500/10 text-pink-400 cursor-not-allowed'
                                    : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Minting...
                                </>
                            ) : isSyncing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Syncing Chain...
                                </>
                            ) : isFetching ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Checking Balance...
                                </>
                            ) : (
                                <>
                                    <Coins className="w-5 h-5" />
                                    Mint PulseTokens
                                </>
                            )}
                        </button>

                        {isSyncing && (
                            <p className="text-xs text-yellow-500/80 text-center animate-pulse">
                                First-time sync can take 1-2 minutes. Please wait...
                            </p>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-400 break-words">{error}</p>
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
            */}
        </div>
    );
}
