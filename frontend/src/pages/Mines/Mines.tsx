import { useState, useEffect, useRef } from 'react';
import { Gem, Bomb } from 'lucide-react';
import { useMinesGame } from '../../hooks/useMinesGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { usePulseToken } from '../../hooks/usePulseToken';

export const Mines = () => {
    // Game Hooks
    const { gameState, loading, startGame, revealTile, cashOut } = useMinesGame();
    const { isConnected, connect } = useLineraWallet();
    const { tokenBalance } = usePulseToken();  // Use PulseToken balance

    // Local UI State
    const [betAmount, setBetAmount] = useState<number>(0);
    const [minesCount, setMinesCount] = useState<number>(3);

    // Derived UI State from Blockchain Data
    const isGameActive = gameState?.result === 'ACTIVE';
    const revealedTiles = gameState?.revealedTiles || [];
    const isGameOver = gameState?.result === 'LOST' || gameState?.result === 'WON' || gameState?.result === 'CASHED_OUT';

    // Determine tile state and content
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


    // Sound Effects Logic
    const prevRevealedCount = useRef(0);
    const prevResult = useRef<string | null>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!gameState) return;

        // Initialize refs on first valid load to avoid playing sounds on refresh
        if (!isInitialized.current) {
            prevRevealedCount.current = gameState.revealedTiles?.length || 0;
            prevResult.current = gameState.result;
            isInitialized.current = true;
            return;
        }

        const currentRevealedCount = gameState.revealedTiles?.length || 0;
        const currentResult = gameState.result;

        // Play Bomb Sound on Loss
        if (currentResult === 'LOST' && prevResult.current === 'ACTIVE') {
            const audio = new Audio('/assets/sound/bomb_sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { }); // Ignore interaction errors
        }
        // Play Diamond Sound on Tile Reveal (if not lost)
        else if (currentRevealedCount > prevRevealedCount.current) {
            if (currentResult !== 'LOST') {
                const audio = new Audio('/assets/sound/diamond_sound.mp3');
                audio.volume = 0.4;
                audio.currentTime = 0; // Reset to start for rapid clicks
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

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 min-h-[600px] items-start justify-center animate-fade-in font-sans selection:bg-white selection:text-black">
            {/* Control Panel - Pro / Technical */}
            <div className="w-full lg:w-[380px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-8 shadow-2xl border border-zinc-800/50 relative overflow-hidden">

                {/* Header */}
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/50 mb-2">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Grid Protocol</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-white">Mines.</h2>
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
                                value={betAmount}
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
                    <button onClick={() => startGame(betAmount, minesCount)} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2">
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
                {isGameOver && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-2xl animate-in fade-in zoom-in duration-300">
                        {gameState?.result === 'WON' && (
                            <>
                                <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">COMPLETE</div>
                                <div className="text-2xl font-bold text-black font-mono bg-white px-8 py-3 rounded-full shadow-xl">
                                    +{(betAmount * ((gameState?.currentMultiplier || 100) / 100) - betAmount).toFixed(4)} PT
                                </div>
                            </>
                        )}
                        {gameState?.result === 'LOST' && (
                            <div className="text-5xl md:text-6xl font-black text-zinc-500 tracking-tighter opacity-50">TERMINATED</div>
                        )}
                        {gameState?.result === 'CASHED_OUT' && (
                            <div className="flex flex-col items-center">
                                <div className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">SECURED</div>
                                <div className="text-3xl font-black text-white font-mono border-b-2 border-white pb-1">{(betAmount * ((gameState?.currentMultiplier || 100) / 100)).toFixed(4)} PT</div>
                            </div>
                        )}
                    </div>
                )}

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
        </div>
    );
};
