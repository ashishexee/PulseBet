import { useState, useEffect, useRef } from 'react';
import { Gem, Bomb } from 'lucide-react';
import { useMinesGame } from '../hooks/useMinesGame';
import { useLineraWallet } from '../hooks/useLineraWallet';
import { usePulseToken } from '../hooks/usePulseToken';

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
            return <Bomb className="w-8 h-8 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />;
        }

        if (isRevealed && !isMine) {
            return <Gem className="w-8 h-8 text-[#00e701] drop-shadow-[0_0_15px_rgba(0,231,1,0.6)] animate-bounce" />;
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
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 min-h-[600px] items-start justify-center animate-fade-in">
            {/* Control Panel - Glassmorphism & 3D Depth */}
            <div className="w-full lg:w-[380px] bg-[#213545]/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-[#2f4553]/50 relative overflow-hidden group">
                {/* Internal Lighting Effect */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-blue)]/10 blur-[80px] rounded-full pointer-events-none -z-0"></div>

                {/* Bet Amount Input */}
                <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex flex-col gap-2 relative transition-all duration-300 hover:border-[#557086] hover:bg-[#0f212e]/70 focus-within:border-[var(--primary-blue)] focus-within:shadow-[0_0_0_3px_rgba(20,117,225,0.2)] shadow-inner">
                    <label className="text-[11px] font-extrabold text-[#8a9db5] pl-1 uppercase tracking-wider flex items-center gap-1">
                        Bet Amount
                        <span className="w-1 h-1 rounded-full bg-[var(--primary-blue)]"></span>
                    </label>
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 bg-[#071824] rounded-lg px-3 py-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                            <Gem className="w-5 h-5 text-[var(--primary-blue)] drop-shadow-[0_0_8px_rgba(20,117,225,0.5)]" />
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                                disabled={isGameActive}
                                className="bg-transparent text-white font-black text-xl w-full outline-none placeholder-[#2f4553] font-mono tracking-tight"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-1 h-full">
                            <button
                                className="bg-[#2f4553] hover:bg-[#3c5566] hover:text-white text-[#b1bad3] text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-[0_4px_0_#1a2c38] active:shadow-none active:translate-y-[4px] border border-[#3c5566]/30"
                                onClick={() => setBetAmount(betAmount / 2)}
                                disabled={isGameActive}
                            >
                                ½
                            </button>
                            <button
                                className="bg-[#2f4553] hover:bg-[#3c5566] hover:text-white text-[#b1bad3] text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-[0_4px_0_#1a2c38] active:shadow-none active:translate-y-[4px] border border-[#3c5566]/30"
                                onClick={() => setBetAmount(betAmount * 2)}
                                disabled={isGameActive}
                            >
                                2x
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mines Count Selection */}
                <div className="bg-[#0f212e]/50 p-4 rounded-xl border border-[#2f4553] flex flex-col gap-2 z-10 hover:border-[#557086] hover:bg-[#0f212e]/70 transition-all shadow-inner">
                    <label className="text-[11px] font-extrabold text-[#8a9db5] pl-1 uppercase tracking-wider flex items-center gap-1">
                        Mines
                        <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    </label>
                    <div className="relative bg-[#071824] rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                        <select
                            value={minesCount}
                            onChange={(e) => setMinesCount(parseInt(e.target.value))}
                            disabled={isGameActive}
                            className="bg-transparent text-white font-bold w-full outline-none cursor-pointer appearance-none py-3 px-3 relative z-10 font-mono"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 24].map(num => (
                                <option key={num} value={num} className="bg-[#0f212e]">{num}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#b1bad3]">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[20px]"></div>

                {/* Action Button - Improved 3D Button */}
                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-gradient-to-br from-[var(--primary-blue)] to-blue-700 hover:brightness-110 text-white font-black py-4 rounded-xl shadow-[0_6px_0_#005a9e,_0_15px_20px_-5px_rgba(0,90,158,0.4)] active:shadow-none active:translate-y-[6px] transition-all transform hover:scale-[1.01]">
                        CONNECT WALLET
                    </button>
                ) : isGameActive ? (
                    <button onClick={cashOut} disabled={loading} className="w-full bg-gradient-to-br from-[#00e701] to-[#00a801] hover:brightness-110 text-[#0f212e] font-black py-4 rounded-xl shadow-[0_6px_0_#008f00,_0_15px_20px_-5px_rgba(0,231,1,0.4)] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-wider relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full hover:animate-shimmer"></div>
                        {loading ? "Processing..." : (
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span className="text-sm opacity-80 font-bold">CASH OUT</span>
                                <span className="text-lg font-mono">{(betAmount * ((gameState?.currentMultiplier || 100) / 100)).toFixed(4)} PULSE</span>
                            </div>
                        )}
                    </button>
                ) : (
                    <button onClick={() => startGame(betAmount, minesCount)} disabled={loading} className="w-full bg-gradient-to-br from-[var(--primary-blue)] to-blue-700 hover:brightness-110 text-white font-black py-4 rounded-xl shadow-[0_6px_0_#005a9e,_0_15px_20px_-5px_rgba(0,90,158,0.4)] active:shadow-none active:translate-y-[6px] transition-all transform hover:scale-[1.01] disabled:opacity-75 disabled:cursor-not-allowed uppercase tracking-wider">
                        {loading ? "Starting..." : "BET"}
                    </button>
                )}

                {/* Local Wallet Balance Display */}
                {isConnected && (
                    <div className="flex justify-between items-center text-xs font-bold text-[#b1bad3] bg-[#0f212e]/50 py-3 px-4 rounded-lg border border-[#2f4553]/30 shadow-sm mt-2">
                        <span className="uppercase tracking-widest opacity-70">Balance</span>
                        <span className="text-white font-mono text-sm drop-shadow-md">{tokenBalance || '0'} PULSE</span>
                    </div>
                )}
            </div>

            {/* Game Grid Area - 3D Container */}
            <div className="flex-1 bg-[#0f212e] rounded-2xl p-8 lg:p-12 relative flex flex-col items-center justify-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-[#2f4553]/50 w-full min-h-[500px] overflow-hidden">

                {/* Subtle Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* Result Overlay */}
                {isGameOver && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f212e]/80 backdrop-blur-md rounded-2xl animate-in fade-in zoom-in duration-300 pointer-events-none">
                        {gameState?.result === 'WON' && (
                            <>
                                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#00e701] to-[#00a801] drop-shadow-[0_0_30px_rgba(0,231,1,0.6)] animate-bounce mb-4">YOU WON!</div>
                                <div className="text-2xl font-bold text-white font-mono bg-[#00e701]/20 px-6 py-2 rounded-full border border-[#00e701]/50 backdrop-blur-md">
                                    +{(betAmount * ((gameState?.currentMultiplier || 100) / 100) - betAmount).toFixed(4)} PULSE
                                </div>
                            </>
                        )}
                        {gameState?.result === 'LOST' && (
                            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-700 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">GAME OVER</div>
                        )}
                        {gameState?.result === 'CASHED_OUT' && (
                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#00e701] to-[#00a801] drop-shadow-[0_0_30px_rgba(0,231,1,0.6)] mb-2">CASHED OUT</div>
                                <div className="text-3xl font-black text-white mt-4 font-mono">{(betAmount * ((gameState?.currentMultiplier || 100) / 100)).toFixed(4)} PULSE</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Multiplier Badge */}
                {isGameActive && (
                    <div className="absolute top-6 right-8 z-30 bg-[#213545]/90 backdrop-blur border border-[#2f4553] px-4 py-2 rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] flex items-center gap-2 transform hover:scale-105 transition-transform cursor-default">
                        <span className="text-xs font-bold text-[#b1bad3] tracking-widest uppercase">Multiplier</span>
                        <span className="text-[#00e701] font-mono font-black text-xl drop-shadow-[0_0_8px_rgba(0,231,1,0.4)]">
                            {((gameState?.currentMultiplier || 100) / 100).toFixed(2)}x
                        </span>
                    </div>
                )}

                {/* Game Grid */}
                <div className="grid grid-cols-5 gap-3 w-full max-w-[480px] aspect-square relative z-10 p-2 bg-[#071824]/50 rounded-2xl border border-[#2f4553]/30 shadow-inner">
                    {Array.from({ length: 25 }).map((_, i) => {
                        const isRevealed = revealedTiles.includes(i);
                        const isMine = gameState?.mineIndices?.includes(i) || false;
                        const showMine = isMine && isGameOver;

                        return (
                            // Tile Button: 3D styling with 'push-down' effect
                            <button
                                key={i}
                                disabled={!isGameActive || isRevealed || loading}
                                onClick={() => revealTile(i)}
                                className={`
                                    rounded-lg transition-all duration-200 relative overflow-hidden flex items-center justify-center outline-none select-none w-full h-full
                                    ${isRevealed || showMine
                                        ? `bg-[#071824] border border-[#2f4553]/30 translate-y-1 ${showMine ? 'bg-red-500/20 border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.4)]' : 'shadow-inner'}` // Revealed
                                        : 'bg-gradient-to-b from-[#3a5b74] to-[#2f4553] border border-transparent shadow-[0_5px_0_#1a2c38] hover:-translate-y-[2px] hover:shadow-[0_7px_0_#1a2c38] hover:brightness-110 active:translate-y-[5px] active:shadow-none' // Hidden
                                    }
                                    ${!isGameActive && !isRevealed ? 'opacity-40 cursor-not-allowed grayscale filter brightness-75' : ''}
                                `}
                            >
                                <div className={`transition-all duration-300 w-full h-full flex items-center justify-center ${isRevealed || showMine ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
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
