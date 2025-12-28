import { useNavigate } from "react-router-dom";
import { Menu, Wallet, LogOut, Copy, Check } from "lucide-react";
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
        <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/")}>
                <button onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} className="text-zinc-400 hover:text-white transition-colors">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    <span className="text-xl font-bold tracking-tighter text-white">
                        PulseBet.
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isConnected ? (
                    <div className="flex items-center gap-6">
                        {/* Token Balance */}
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Available</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-sm">
                                    {tokenBalance ?? "0"} PT
                                </span>
                                <span className="text-zinc-700 text-xs">|</span>
                                <span className="font-mono text-zinc-400 text-xs">
                                    {balance ?? "0"} BUILD
                                </span>
                            </div>
                        </div>

                        {/* Network Info */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-zinc-400 truncate max-w-[100px]">
                                {chainId ? `${chainId.slice(0, 8)}...` : "Loading..."}
                            </span>
                            <button
                                onClick={() => chainId && copyToClipboard(chainId, 'chainId')}
                                className="text-zinc-600 hover:text-white transition-colors"
                            >
                                {copiedChainId ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>

                        {/* Wallet Address */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => owner && copyToClipboard(owner, 'address')}>
                            <span className="text-xs font-mono text-white truncate max-w-[80px]">
                                {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "..."}
                            </span>
                            {copiedAddress ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-zinc-600 group-hover:text-white transition-colors" />}
                        </div>

                        <button
                            onClick={disconnect}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                            title="Disconnect"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connect}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all transform active:scale-95"
                    >
                        <Wallet className="w-4 h-4" />
                        <span>Connect Protocol</span>
                    </button>
                )}
            </div>
        </header>
    );
};
