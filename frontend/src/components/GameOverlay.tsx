import { useState, useEffect } from 'react';
import { Wallet, Info, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameOverlayProps {
    isConnected: boolean;
    connect: () => void;
    gameId: string; // Unique ID for localStorage (e.g., 'bingo', 'rules_mines')
    gameTitle: string;
    rules: React.ReactNode;
}

export const GameOverlay = ({ isConnected, gameId, gameTitle, rules }: GameOverlayProps) => {
    const [showRules, setShowRules] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Check if rules should be shown on mount (only if connected)
    useEffect(() => {
        if (isConnected) {
            const hasSeenRules = localStorage.getItem(`rules_seen_${gameId}`);
            if (!hasSeenRules) {
                setShowRules(true);
            }
        } else {
            // Hide rules if disconnected (Wallet overlay takes precedence)
            setShowRules(false);
        }
    }, [isConnected, gameId]);

    const handleCloseRules = () => {
        if (dontShowAgain) {
            localStorage.setItem(`rules_seen_${gameId}`, 'true');
        }
        setShowRules(false);
    };

    return (
        <AnimatePresence>
            {/* 1. Wallet Connection Overlay */}
            {!isConnected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[48] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800 shadow-2xl">
                            <Wallet className="w-10 h-10 text-zinc-400" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-white tracking-tighter">Connect Wallet</h2>
                            <p className="text-zinc-400 text-sm font-medium">
                                You need to connect your wallet to verify your identity and play {gameTitle}.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. Game Rules Overlay */}
            {isConnected && showRules && rules && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[48] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="max-w-2xl w-full bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Background Gradients */}
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Title */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-zinc-800 rounded-xl">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">{gameTitle} Rules</h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">How to Play</p>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-8 text-left">
                            {rules}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">

                            <button
                                onClick={() => {
                                    const newValue = !dontShowAgain;
                                    setDontShowAgain(newValue);
                                    // Save immediately to handle refresh/crash edge cases
                                    if (newValue) {
                                        localStorage.setItem(`rules_seen_${gameId}`, 'true');
                                    } else {
                                        localStorage.removeItem(`rules_seen_${gameId}`);
                                    }
                                }}
                                className="flex items-center gap-3 group text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
                            >
                                {dontShowAgain ? (
                                    <CheckSquare className="w-5 h-5 text-white" />
                                ) : (
                                    <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-500" />
                                )}
                                <span>Don't show this again</span>
                            </button>

                            <button
                                onClick={handleCloseRules}
                                className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-wider"
                            >
                                Start Playing
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
