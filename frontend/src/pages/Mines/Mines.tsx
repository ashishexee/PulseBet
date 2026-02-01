import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Bomb } from 'lucide-react';
import { useMinesGame } from '../../hooks/useMinesGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';
import { GameOverlay } from '../../components/GameOverlay';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MINES_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Navigate the grid to find Gems while avoiding hidden Bombs. Each Gem increases your multiplier.
            </p>
        </div>

        <div className="space-y-3 pt-2">
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <Gem className="w-5 h-5 text-white" />
                <div className="text-sm text-zinc-300"><strong>Reveal Gems</strong> to increase your payout multiplier.</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <Bomb className="w-5 h-5 text-zinc-500" />
                <div className="text-sm text-zinc-300"><strong>Avoid Bombs</strong> or lose your accumulated stake.</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="w-5 h-5 rounded bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xs">$</div>
                <div className="text-sm text-zinc-300"><strong>Cash Out</strong> at any time to secure your winnings.</div>
            </div>
        </div>

        <div className="mt-2 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Risk vs Reward</p>
            <p className="text-white font-mono text-xs">More Mines = Higher Multiplier = Higher Risk</p>
        </div>
    </div>
);

export const Mines = () => {
    const { gameState, loading, startGame, revealTile, cashOut } = useMinesGame();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance } = usePulseToken();
    const navigate = useNavigate();
    const [betAmount, setBetAmount] = useState<number>(0);
    const [minesCount, setMinesCount] = useState<number>(3);
    const isGameActive = gameState?.result === 'ACTIVE';
    const revealedTiles = gameState?.revealedTiles || [];
    const isGameOver = gameState?.result === 'LOST' || gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT';

    // Overlay State
    const [showOverlay, setShowOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (isGameOver) {
            setShowOverlay(true);
            setCountdown(5);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setShowOverlay(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setShowOverlay(false);
        }
    }, [isGameOver, gameState?.result]); // Run when game over state changes

    const getTileContent = (id: number) => {
        const isRevealed = revealedTiles.includes(id);
        const isMine = gameState?.mineIndices?.includes(id) || false;

        const showMine = isMine && isGameOver;

        if (!isRevealed && !showMine) {
            return null;
        }

        if (showMine || (isRevealed && isMine)) {
            return <Bomb className="w-8 h-8 text-zinc-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />;
        }

        if (isRevealed && !isMine) {
            return <Gem className="w-8 h-8 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-bounce" />;
        }

        return null;
    };

    const prevRevealedCount = useRef(0);
    const prevResult = useRef<string | null>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!gameState) return;
        if (!isInitialized.current) {
            prevRevealedCount.current = gameState.revealedTiles?.length || 0;
            prevResult.current = gameState.result;
            isInitialized.current = true;
            return;
        }

        const currentRevealedCount = gameState.revealedTiles?.length || 0;
        const currentResult = gameState.result;
        if (currentResult === 'LOST' && prevResult.current === 'ACTIVE') {
            const audio = new Audio('/assets/sound/bomb_sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        }
        else if (currentRevealedCount > prevRevealedCount.current) {
            if (currentResult !== 'LOST') {
                const audio = new Audio('/assets/sound/diamond_sound.mp3');
                audio.volume = 0.4;
                audio.currentTime = 0;
                audio.play().catch(() => { });
            }
        }

        // Update refs
        prevRevealedCount.current = currentRevealedCount;
        prevResult.current = currentResult;

        // Reset initialization if game resets (e.g. back to start screen options)
        if (!gameState.result) {
            isInitialized.current = false;
        }

    }, [gameState]);


    const handleStartGame = () => {
        if (betAmount <= 0) {
            toast.error("Invalid Stake", {
                description: "Please enter a bet amount greater than 0.",
                duration: 3000,
            });
            return;
        }
        const currentBalance = parseFloat(tokenBalance || '0');
        if (betAmount > currentBalance) {
            toast.error("Insufficient Funds", {
                description: "You don't have enough PulseTokens for this bet.",
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
        startGame(betAmount, minesCount);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 min-h-[600px] items-start justify-center animate-fade-in font-sans selection:bg-white selection:text-black relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="mines"
                gameTitle="Mines Protocol"
                rules={MINES_RULES}
            />
            {/* Control Panel - Pro / Technical */}
            <div className="w-full lg:w-[380px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-8 shadow-2xl border border-zinc-800/50 relative overflow-hidden">

                {/* Header */}
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/50 mb-2">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Grid Protocol</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-white">Mines</h2>
                    <p className="text-zinc-500 text-sm">Navigate the entropy field.</p>
                </div>

                {/* Bet Amount Input */}
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                        Injection Amount
                        <span className="text-white font-mono">{betAmount.toFixed(0)} PT</span>
                    </label>
                    <div className="bg-black/50 p-1.5 rounded-xl border border-zinc-800 flex items-center gap-2 focus-within:border-zinc-600 transition-colors">
                        <div className="flex-1 px-3 py-2">
                            <input
                                type="number"
                                value={betAmount === 0 ? '' : betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={isGameActive}
                                className="bg-transparent text-white font-mono font-bold text-xl w-full outline-none placeholder-zinc-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-1 pr-1">
                            <button
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 uppercase tracking-wider"
                                onClick={() => setBetAmount(betAmount / 2)}
                                disabled={isGameActive}
                            >
                                1/2
                            </button>
                            <button
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 uppercase tracking-wider"
                                onClick={() => setBetAmount(betAmount * 2)}
                                disabled={isGameActive}
                            >
                                2x
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mines Count Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        Entropy Level
                    </label>
                    <div className="relative bg-black/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <select
                            value={minesCount}
                            onChange={(e) => setMinesCount(parseInt(e.target.value))}
                            disabled={isGameActive}
                            className="bg-transparent text-white font-mono font-bold w-full outline-none cursor-pointer appearance-none py-4 px-4 relative z-10"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 24].map(num => (
                                <option key={num} value={num} className="bg-zinc-900 text-white">{num} MINES</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                            <span className="text-xs font-mono">{minesCount}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1"></div>

                {/* Action Buttons */}
                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99] uppercase tracking-wider text-sm">
                        INITIALIZE WALLET
                    </button>
                ) : isGameActive ? (
                    <button onClick={cashOut} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg shadow-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider relative overflow-hidden group">
                        {loading ? "PROCESSING..." : (
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span className="text-xs font-bold tracking-widest text-zinc-500 group-hover:text-black transition-colors">SECURE YIELD</span>
                                <span className="text-xl font-mono tracking-tight">{(betAmount * ((gameState?.currentMultiplier || 100) / 100)).toFixed(4)} PT</span>
                            </div>
                        )}
                    </button>
                ) : (
                    <button onClick={handleStartGame} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                        {loading ? "INITIALIZING..." : (
                            <>
                                INITIATE SEQUENCE
                            </>
                        )}
                    </button>
                )}

                {/* Local Wallet Balance Display */}
                {isConnected && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 pt-4 border-t border-zinc-800">
                        <span className="uppercase tracking-widest">Available Liquidity</span>
                        <span className="text-white font-mono text-xs">{tokenBalance || '0'} PT</span>
                    </div>
                )}
            </div>

            {/* Game Grid Area */}
            <div className="flex-1 bg-zinc-900/30 rounded-3xl p-8 lg:p-12 relative flex flex-col items-center justify-center shadow-2xl border border-zinc-800 w-full min-h-[600px] overflow-hidden">

                {/* Subtle Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                {/* Result Overlay */}
                <AnimatePresence>
                    {showOverlay && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-2xl"
                        >
                            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 min-w-[320px] relative overflow-hidden text-center m-4">
                                {/* Close Button */}
                                <button
                                    onClick={() => setShowOverlay(false)}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>

                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                        {gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT' ? 'Winning Round' : 'Round Over'}
                                    </h3>
                                    <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 w-full">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Status</div>
                                        <div className={`text-xl font-black ${gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT' ? 'text-white' : 'text-zinc-500'}`}>
                                            {gameState?.result === 'WON' ? 'COMPLETE' : gameState?.result === 'CASHED_OUT' ? 'SECURED' : 'TERMINATED'}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</div>
                                        <div className={`text-3xl font-black ${gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT' ? 'text-white' : 'text-zinc-600'}`}>
                                            {((gameState?.currentMultiplier || 100) / 100).toFixed(2)}x
                                        </div>
                                    </div>
                                </div>

                                {(gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT') && (
                                    <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                        +{(betAmount * ((gameState?.currentMultiplier || 100) / 100)).toFixed(4)} PT
                                    </div>
                                )}

                                {/* Timer Bar */}
                                <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden mt-2">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 5, ease: "linear" }}
                                        className="h-full bg-white"
                                    />
                                </div>
                                <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                                    Closing in {countdown}s
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Multiplier Badge */}
                {isGameActive && (
                    <div className="absolute top-6 right-8 z-30 bg-black/80 backdrop-blur border border-zinc-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Current Yield</span>
                        <span className="text-white font-mono font-bold text-xl">
                            {((gameState?.currentMultiplier || 100) / 100).toFixed(2)}x
                        </span>
                    </div>
                )}

                {/* Game Grid */}
                <div className="grid grid-cols-5 gap-3 w-full max-w-[500px] aspect-square relative z-10">
                    {Array.from({ length: 25 }).map((_, i) => {
                        const isRevealed = revealedTiles.includes(i);
                        const isMine = gameState?.mineIndices?.includes(i) || false;
                        const showMine = isMine && isGameOver;

                        return (
                            <button
                                key={i}
                                disabled={!isGameActive || isRevealed || loading}
                                onClick={() => revealTile(i)}
                                className={`
                                    rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center outline-none select-none w-full h-full
                                    ${isRevealed || showMine
                                        ? `bg-black border border-zinc-900 ${showMine ? 'border-zinc-700' : ''}` // Revealed
                                        : 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 active:scale-95' // Hidden
                                    }
                                    ${!isGameActive && !isRevealed ? 'opacity-20 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className={`transition-all duration-300 w-full h-full flex items-center justify-center ${isRevealed || showMine ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                    {getTileContent(i)}
                                </div>
                            </button>
                        );
                    })}
                </div>
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
};
