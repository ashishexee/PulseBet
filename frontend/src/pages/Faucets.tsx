import { useState } from 'react';
import { Coins, Zap } from 'lucide-react';
import { useLineraWallet } from '../hooks/useLineraWallet';
import { usePulseToken } from '../hooks/usePulseToken';

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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Faucets
                </h1>
                <p className="text-gray-400">Get free tokens to start playing</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Linera Native Token Faucet */}
                <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1520] rounded-2xl p-6 border border-[#2a3441] shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Coins className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Linera Faucet</h2>
                            <p className="text-sm text-gray-400">Native blockchain token</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#0f1520] rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">Current Balance</div>
                            <div className="text-2xl font-bold text-white">{balance || '0'} LINERA</div>
                        </div>

                        <button
                            onClick={handleFaucetRequest}
                            disabled={loading || !owner}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            {loading ? 'Processing...' : 'Request 10 LINERA'}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Free tokens for testing purposes
                        </p>
                    </div>
                </div>

                {/* PulseToken Faucet */}
                <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1520] rounded-2xl p-6 border border-[#2a3441] shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Coins className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">PulseToken Faucet</h2>
                            <p className="text-sm text-gray-400">Game currency token</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#0f1520] rounded-xl p-4">
                            <div className="text-sm text-gray-400 mb-1">Token Balance</div>
                            <div className="text-2xl font-bold text-white">{tokenBalance || '0'} PULSE</div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Mint Amount</label>
                            <input
                                type="number"
                                value={tokenMintAmount}
                                onChange={(e) => setTokenMintAmount(e.target.value)}
                                className="w-full bg-[#0f1520] border border-[#2a3441] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Enter amount"
                                min="1"
                            />
                        </div>

                        <button
                            onClick={handleTokenMint}
                            disabled={loading || !isReady || !tokenMintAmount}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            {loading ? 'Minting...' : `Mint ${tokenMintAmount} PULSE`}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Custom token for in-game use
                        </p>
                    </div>
                </div>
            </div>

            {!owner && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                    <p className="text-yellow-400">Please connect your wallet to use the faucets</p>
                </div>
            )}
        </div>
    );
}
