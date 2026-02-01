import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePlinkoGame } from '../../hooks/usePlinkoGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';
import { GameOverlay } from '../../components/GameOverlay';
import { motion, AnimatePresence } from 'framer-motion';

const ROWS = 8;
const CHECKPOINTS = [1, 3, 5, 7, 8];
const MULTIPLIERS = [10.0, 0.25, 1.5, 0.5, 2.5, 0.5, 1.5, 0.25, 10.0];

const PLINKO_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Chaos Protocol</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                A non-linear gravity simulation. Drop the Core and navigate the entropy field.
            </p>
        </div>
        <div className="space-y-3 pt-2">
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="w-5 h-5 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                <div className="text-sm text-zinc-300"><strong>The Core</strong> drops through 8 layers of decision nodes.</div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 flex items-center gap-4">
                <div className="text-yellow-500 font-bold">⚠️</div>
                <div className="text-sm text-zinc-300"><strong>Watch Out!</strong> High multipliers (7.77x) are right next to Traps (0.1x).</div>
            </div>
        </div>
    </div>
);

export const Plinko = () => {
    const { gameState, loading: gameLoading, startGame, advanceBatch } = usePlinkoGame();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance } = usePulseToken();
    const navigate = useNavigate();

    const [betAmount, setBetAmount] = useState<number>(0);

    const boardWidth = 800;
    const boardHeight = 600;
    const rowHeight = (boardHeight - 100) / ROWS;
    const xStep = boardWidth / 20;

    const getBallPos = (r: number, c: number) => {
        const x = c * xStep;
        const y = r * rowHeight;
        return { x, y };
    };

    useEffect(() => {
        if (!gameState) return;
        if (gameState.result !== 'ACTIVE') return;

        const r = gameState.currentRow;
        const nextTarget = CHECKPOINTS.find(cp => cp > r);

        if (nextTarget) {
            const timer = setTimeout(() => {
                advanceBatch(nextTarget);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    const isGameActive = gameState?.result === 'ACTIVE';
    const ballPos = gameState ? getBallPos(gameState.currentRow, gameState.currentCol) : getBallPos(0, 0);

    const renderPins = () => {
        const pins = [];

        for (let r = 0; r <= ROWS; r++) {
            for (let c = -8; c <= 8; c++) {
                if (Math.abs(c) % 2 !== r % 2) continue;

                const isActive = Math.abs(c) <= r;
                const { x, y } = getBallPos(r, c);

                const sizeClass = isActive ? "w-3 h-3" : "w-1.5 h-1.5";
                const bgClass = isActive
                    ? "bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                    : "bg-zinc-800 opacity-20";

                pins.push(
                    <div
                        key={`${r}-${c}`}
                        className={`absolute rounded-full transition-all duration-500 ${sizeClass} ${bgClass}`}
                        style={{
                            left: '50%',
                            top: y,
                            marginLeft: x - (isActive ? 6 : 3),
                        }}
                    ></div>
                );
            }
        }
        return pins;
    };

    // Overlay State
    const [showOverlay, setShowOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [lastWin, setLastWin] = useState(0);

    useEffect(() => {
        if (!gameState) return;
        if (gameState.result === 'WON') {
            setLastWin(betAmount * (gameState.finalMultiplier || 0) / 100);
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
        }
    }, [gameState?.result]);

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto p-4 lg:p-8 min-h-[800px] items-center xl:items-start justify-center animate-fade-in font-sans selection:bg-pink-500 selection:text-white relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="plinko"
                gameTitle="Plinko: Chaos Core"
                rules={PLINKO_RULES}
            />

            {/* Result Overlay */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-2xl fixed inset-0 z-[100]"
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
                                    Path Complete
                                </h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 w-full">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Payout</div>
                                    <div className="text-xl font-black text-white">
                                        {lastWin.toFixed(2)} PT
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Multiplier</div>
                                    <div className="text-3xl font-black text-white">
                                        {((gameState?.finalMultiplier || 100) / 100).toFixed(2)}x
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white text-black px-8 py-3 rounded-full font-black text-xl tracking-wide shadow-lg shadow-white/10">
                                +{lastWin.toFixed(4)} PT
                            </div>

                            {/* Timer Bar */}
                            <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-white"
                                    key={showOverlay ? 'active' : 'inactive'}
                                />
                            </div>
                            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                                Closing in {countdown}s
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-[400px] bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 flex flex-col gap-8 shadow-2xl border border-zinc-800/50 relative overflow-hidden shrink-0 h-fit">
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 mb-2">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_#ec4899]"></span>
                        <span className="text-[10px] font-black text-pink-500 tracking-[0.2em] uppercase">Gravity Protocol</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Plinko</h2>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Chaos Core Edition v2.0</p>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                        Injection Amount
                        <span className="text-white font-mono">{betAmount.toFixed(0)} PT</span>
                    </label>
                    <div className="bg-black/60 p-2 rounded-2xl border border-zinc-800 flex items-center gap-2 focus-within:border-pink-500/50 transition-all shadow-inner">
                        <div className="flex-1 px-3 py-2">
                            <input
                                type="number"
                                value={betAmount === 0 ? '' : betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={isGameActive}
                                className="bg-transparent text-white font-mono font-bold text-2xl w-full outline-none placeholder-zinc-800"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-1 pr-1">
                            <button
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 uppercase tracking-wider"
                                onClick={() => setBetAmount(betAmount / 2)}
                                disabled={isGameActive}
                            >
                                1/2
                            </button>
                            <button
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 uppercase tracking-wider"
                                onClick={() => setBetAmount(betAmount * 2)}
                                disabled={isGameActive}
                            >
                                2x
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-8"></div>

                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] uppercase tracking-widest text-sm shadow-pink-900/20">
                        Initializing System...
                    </button>
                ) : isGameActive ? (
                    <button disabled className="w-full bg-zinc-800 text-zinc-500 font-bold py-5 rounded-2xl cursor-not-allowed uppercase tracking-widest flex items-center justify-center gap-3 border border-zinc-700/50">
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></div>
                        Simulating Path...
                    </button>
                ) : (
                    <button onClick={() => {
                        const currentBalance = parseFloat(tokenBalance || '0');
                        if (betAmount <= 0) {
                            toast.error("Invalid Stake", {
                                description: "Please enter a bet amount greater than 0.",
                                duration: 3000,
                            });
                            return;
                        }
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
                        startGame(betAmount);
                    }} disabled={gameLoading} className="w-full bg-white hover:bg-zinc-100 text-black font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                        {gameLoading ? "INITIALIZING..." : (
                            <>
                                <span>DROP CORE</span>
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-black border-r-[6px] border-r-transparent"></div>
                            </>
                        )}
                    </button>
                )}

                {isConnected && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 pt-6 border-t border-zinc-800/50">
                        <span className="uppercase tracking-widest">Available Liquidity</span>
                        <span className="text-white font-mono text-sm">{tokenBalance || '0'} PT</span>
                    </div>
                )}
            </div>

            <div className="flex-1 w-full flex items-center justify-center min-w-[350px]">
                <div
                    className="relative bg-zinc-950 rounded-[3rem] border border-zinc-800 shadow-2xl flex flex-col items-center overflow-hidden"
                    style={{
                        width: '1000px',
                        maxWidth: '100%',
                        height: '700px',
                        boxShadow: '0 0 50px -20px rgba(0,0,0,0.8)'
                    }}
                >
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.1) 0%, transparent 70%)'
                        }}>
                    </div>

                    <div className="relative w-full h-full flex flex-col items-center justify-center py-12">

                        <div className="absolute inset-0 pointer-events-none opacity-60">
                            {renderPins()}
                        </div>

                        <div className="absolute inset-0 pointer-events-none">
                            <AnimatePresence mode="wait">
                                {(gameState?.result === 'ACTIVE' || gameState?.result === 'WON') && (
                                    <motion.div
                                        className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(236,72,153,1)] z-50 border-2 border-pink-200"
                                        initial={getBallPos(0, 0)}
                                        animate={{
                                            x: ballPos.x,
                                            y: ballPos.y
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15,
                                            mass: 1.0
                                        }}
                                        style={{
                                            left: '50%',
                                            marginLeft: -10,
                                            top: 0
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-pink-500 rounded-full animate-pulse opacity-50 blur-sm"></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {gameState?.result === 'WON' && (
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center animate-in zoom-in duration-300 pointer-events-none">
                                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter">
                                    {((gameState.finalMultiplier || 0) / 100).toFixed(2)}x
                                </div>
                                <div className="mt-4 inline-block bg-pink-500/20 border border-pink-500/50 backdrop-blur-md px-6 py-2 rounded-full shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                                    <span className="text-lg font-bold text-white font-mono">
                                        + {((betAmount * (gameState.finalMultiplier || 0)) / 100).toFixed(2)} PT
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-12 flex justify-center gap-2 items-end w-full px-12 max-w-[800px]">
                            {MULTIPLIERS.map((mul, idx) => {
                                let bgClass = "bg-zinc-900 border-zinc-800 text-zinc-600";
                                let heightClass = "h-16";
                                let shadowClass = "";

                                if (mul >= 500) {
                                    bgClass = "bg-gradient-to-t from-pink-700 to-pink-500 text-white border-pink-400";
                                    heightClass = "h-24";
                                    shadowClass = "shadow-[0_0_25px_rgba(236,72,153,0.6)] z-10";
                                } else if (mul >= 100) {
                                    bgClass = "bg-zinc-800 text-white border-zinc-700";
                                    heightClass = "h-20";
                                } else if (mul < 10 && mul > 1) {
                                    bgClass = "bg-zinc-900/80 text-zinc-500 border-zinc-800";
                                    heightClass = "h-14";
                                } else if (mul < 1) {
                                    bgClass = "bg-zinc-950 text-zinc-700 border-zinc-900";
                                    heightClass = "h-12";
                                }

                                return (
                                    <div key={idx} className={`
                                        flex-1 rounded-2xl flex flex-col items-center justify-center border-b-0 border-t-2 border-x
                                        transition-all duration-300 relative group
                                        ${bgClass} ${heightClass} ${shadowClass}
                                    `}>
                                        <span className={`text-[10px] md:text-xs font-black font-mono transform group-hover:-translate-y-1 transition-transform ${mul >= 100 ? 'scale-110' : ''}`}>
                                            {mul}x
                                        </span>
                                        {mul >= 100 && (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
