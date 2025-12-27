import { useNavigate } from "react-router-dom";
import { Hammer, Wallet, LogOut, Copy, Check } from "lucide-react";
import { useLineraWallet } from "../../hooks/useLineraWallet";
import { usePulseToken } from "../../hooks/usePulseToken";
import { useState } from "react";

interface HeaderProps {
    toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
    const { isConnected, connect, disconnect, chainId, balance, owner } = useLineraWallet();
    const { tokenBalance } = usePulseToken();
    const navigate = useNavigate();
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [copiedChainId, setCopiedChainId] = useState(false);

    const copyToClipboard = async (text: string, type: 'address' | 'chainId') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'address') {
                setCopiedAddress(true);
                setTimeout(() => setCopiedAddress(false), 2000);
            } else {
                setCopiedChainId(true);
                setTimeout(() => setCopiedChainId(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                {/* Menu Button for Mobile/Toggle */}
                <button onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} className="mr-2 text-gray-400 hover:text-white">
                    <Hammer className="w-6 h-6 rotate-90" />
                </button>
                <span className="text-xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
                    PulseBet
                </span>
            </div>

            <div className="flex items-center gap-4">
                {isConnected ? (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-xs text-gray-400">Address</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-green-400 max-w-[100px] truncate" title={owner || ""}>
                                    {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "..."}
                                </span>
                                <button
                                    onClick={() => owner && copyToClipboard(owner, 'address')}
                                    className="text-gray-400 hover:text-green-400 transition-colors"
                                    title="Copy address"
                                >
                                    {copiedAddress ? (
                                        <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-xs text-gray-400">Chain ID</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-blue-400 max-w-[100px] truncate" title={chainId || ""}>
                                    {chainId ? `${chainId.slice(0, 6)}...${chainId.slice(-4)}` : "Loading..."}
                                </span>
                                <button
                                    onClick={() => chainId && copyToClipboard(chainId, 'chainId')}
                                    className="text-gray-400 hover:text-blue-400 transition-colors"
                                    title="Copy chain ID"
                                >
                                    {copiedChainId ? (
                                        <Check className="w-3 h-3 text-blue-400" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-xs text-gray-400">Balance</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-pink-500" title="PulseToken">
                                    {tokenBalance ?? "..."} PULSE
                                </span>
                                <span className="text-xs text-gray-600">|</span>
                                <span className="text-sm font-mono text-[#3B82F6]" title="Native BUILD">
                                    {balance !== null ? `${balance} BUILD` : "..."}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={disconnect}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Disconnect</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connect}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                        <Wallet className="w-4 h-4" />
                        <span>Connect MetaMask</span>
                    </button>
                )}
            </div>
        </header>
    );
};
