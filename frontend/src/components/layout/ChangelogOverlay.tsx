import { useState, useEffect } from 'react';
import { X, Check, Gamepad2, Zap, LayoutTemplate, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChangelogOverlay() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenChangelog_v2');
        if (!hasSeen) {
            // Small delay to ensure it doesn't clash with other init animations
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleDoNotShowAgain = () => {
        localStorage.setItem('hasSeenChangelog_v2', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative h-32 bg-gradient-to-br from-emerald-900/50 to-zinc-900 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                            <div className="relative z-10 text-center">
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">What's New in PulseBet</h2>
                                <p className="text-emerald-400 font-mono text-sm">Wave 5 Updates</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">

                            {/* Feature 1: Autosigner */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Seamless Auto-Signer</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-3">
                                        Checking the header badge? That's our new <strong>Session Key</strong> system! Thanks to <a href="https://app.akindo.io/users/deuszx" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-semibold hover:underline">@deuszx</a> and <a href="https://app.akindo.io/users/ma2bd" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-semibold hover:underline">@ma2bd</a>,
                                        you can now play games instantly. The Autosigner handles all your fast-paced gameplay moves in the background without annoying interruptions.
                                    </p>
                                    <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg">
                                        <p className="text-xs text-zinc-400 leading-normal">
                                            <span className="text-amber-500 font-bold block mb-1">Why do I still see MetaMask popups?</span>
                                            For your security, <strong>money matters are strictly explicit.</strong> Any action that moves your PulseTokens—like
                                            <span className="text-zinc-300"> Staking, Betting, or Claiming Rewards</span>—will <strong>ALWAYS</strong> require a clear MetaMask popup confirmation. The Autosigner only signs the valid game moves <em>after</em> you've securely staked your tokens.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2: New Games */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Gamepad2 className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">New Arcade Games</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        The arena has leveled up! We've introduced 5 adrenaline-pumping games where you can stake <strong>PulseTokens</strong> to multiply your bag.
                                        Drop the ball in <strong>Plinko</strong>, test your luck with <strong>Keno</strong> numbers, spin the <strong>Wheel</strong> of fortune, roll high in <strong>Dice</strong>, or go for the classic 50/50 in <strong>Coin Toss</strong>.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {['Plinko', 'Keno', 'Wheel', 'Dice', 'Coin Toss'].map(game => (
                                            <span key={game} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                                                {game}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3: UI Improvements */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <LayoutTemplate className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Visual Overhaul</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        We've completely redesigned the experience with a premium <strong>Dark Glassmorphism</strong> aesthetic.
                                        Enjoy buttery-smooth animations, neon-accented game boards, and a fully reactive interface that adapts perfectly whether you're on desktop or mobile. It's not just a game; it's a vibe.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 4: Toasts */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <Bell className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Smart Notifications</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        Stay in the loop with our new <strong>Intelligent Toast System</strong>.
                                        Get instant, crystal-clear feedback on every action—from game results (Wins/Losses) to blockchain transaction confirmations. No more guessing if your bet went through!
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                Remind Me Later
                            </button>
                            <button
                                onClick={handleDoNotShowAgain}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <Check className="w-4 h-4" />
                                Got it! Don't show again
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
