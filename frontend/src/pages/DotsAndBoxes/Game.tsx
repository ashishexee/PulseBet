import { useState } from 'react';
import { Board } from './Board';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { useDotsAndBoxes } from '../../hooks/useDotsAndBoxes';
import { Play, Users, Copy } from 'lucide-react';

export const DotsAndBoxesGame = () => {
    const { isConnected, connect, owner } = useLineraWallet();

    // UI State
    const [inputGameId, setInputGameId] = useState('');
    const [activeGameId, setActiveGameId] = useState<string>(''); // Determines which game we are viewing/playing

    // Contract Hook
    // Note: useDotsAndBoxes encapsulates the Linera SDK interaction pattern
    const { gameState, loading, createGame, joinGame, makeMove } = useDotsAndBoxes(activeGameId);

    // Derived State
    // Derived State
    const status = gameState ? 'PLAYING' : 'LOBBY';
    const normalizedOwner = owner?.toLowerCase();
    const p1 = gameState?.player1.toLowerCase();
    const p2 = gameState?.player2?.toLowerCase();

    const isP1 = normalizedOwner === p1;
    const isP2 = normalizedOwner === p2;
    const isPlayerTurn = gameState?.currentTurn.toLowerCase() === normalizedOwner;
    const canPlay = isConnected && isPlayerTurn && (isP1 || isP2);

    // Colors
    const P1_COLOR = '#22c55e'; // Green
    const P2_COLOR = '#ef4444'; // Red

    const handleCreateGame = async () => {
        const size = 8; // Default
        const newId = await createGame(size);
        if (newId) {
            setActiveGameId(newId);
        }
    };

    const handleJoinGame = async () => {
        if (!inputGameId) return;
        await joinGame(inputGameId);
        setActiveGameId(inputGameId);
    };

    const handleLineClick = async (orientation: 'h' | 'v', r: number, c: number) => {
        if (!canPlay || !gameState) return;
        let r2 = r, c2 = c;
        if (orientation === 'h') c2 = c + 1;
        else r2 = r + 1;

        await makeMove(activeGameId, r, c, r2, c2);
    };

    // Convert Contract Lines to Set<string> format for Board
    const hLines = new Set<string>();
    gameState?.horizontalLines.forEach(l => {
        let s = l.start, e = l.end;
        // Normalize: ensure we store the left-most dot for horizontal lines
        if (s.col > e.col) { s = e; }
        hLines.add(`${s.row},${s.col}`);
    });

    const vLines = new Set<string>();
    gameState?.verticalLines.forEach(l => {
        let s = l.start, e = l.end;
        // Normalize: ensure we store the top-most dot for vertical lines
        if (s.row > e.row) { s = e; }
        vLines.add(`${s.row},${s.col}`);
    });

    const squareMap = new Map<string, string>();
    if (gameState?.squares) {
        // Contract returns squares as an object/record: { "r,c": "owner_id" }
        Object.entries(gameState.squares).forEach(([key, owner]) => {
            const color = owner.toLowerCase() === gameState.player1.toLowerCase() ? P1_COLOR : P2_COLOR;
            squareMap.set(key, color);
        });
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1200px] mx-auto p-4 lg:p-8 min-h-[600px] items-start justify-center animate-fade-in font-sans selection:bg-white selection:text-black">
            {/* Control Panel */}
            <div className="w-full lg:w-[380px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-8 shadow-2xl border border-zinc-800/50">
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/50 mb-2">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">Grid Protocol</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter text-white">Dots & Boxes.</h2>
                    <p className="text-zinc-500 text-sm">Strategic territory control.</p>
                </div>

                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm">
                        Connect Wallet
                    </button>
                ) : status === 'LOBBY' ? (
                    <div className="space-y-6">
                        <button onClick={handleCreateGame} disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? 'CREATING...' : <><Play size={16} /> Create Game</>}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black/50 px-2 text-zinc-500">Or Join</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ENTER GAME ID"
                                value={inputGameId}
                                onChange={(e) => setInputGameId(e.target.value)}
                                className="bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono w-full outline-none focus:border-white transition-colors uppercase placeholder-zinc-700 text-xs"
                            />
                            <button onClick={handleJoinGame} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50 text-xs">
                                {loading ? '...' : 'JOIN'}
                            </button>
                        </div>
                        {activeGameId && !gameState && (
                            <div className="text-center text-xs text-zinc-500">
                                Connecting to {activeGameId.substring(0, 8)}...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-black/50 rounded-xl border border-zinc-800">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Game ID</div>
                            <div className="font-mono text-xl text-white tracking-wider flex items-center justify-between gap-2 overflow-hidden">
                                <span className="truncate">{activeGameId}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(activeGameId)}
                                    className="text-xs bg-zinc-800 px-2 py-1 rounded cursor-pointer hover:bg-zinc-700 flex items-center gap-1 shrink-0"
                                >
                                    <Copy size={12} /> COPY
                                </button>
                            </div>
                            {isP1 && !gameState?.player2 && (
                                <div className="mt-2 text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                    Waiting for P2. Share ID with a friend. <br />
                                    <strong>Note:</strong> You cannot join your own game. P2 must use a different wallet.
                                </div>
                            )}
                        </div>

                        {/* Player Identity Badge */}
                        <div className="flex justify-center">
                            {isP1 && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">YOU ARE PLAYER 1</span>}
                            {isP2 && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">YOU ARE PLAYER 2</span>}
                            {!isP1 && !isP2 && <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">OBSERVER MODE</span>}
                        </div>

                        <div className="flex gap-4">
                            <div className={`flex-1 p-4 rounded-xl border ${gameState?.currentTurn === gameState?.player1 ? 'bg-zinc-800/80 border-green-500/50' : 'bg-black/30 border-zinc-800'}`}>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Player 1</div>
                                <div className="text-2xl font-bold text-green-500">{gameState?.scores[0]}</div>
                                <div className="text-xs text-zinc-600 truncate">{gameState?.player1.substring(0, 8)}...</div>
                            </div>
                            <div className={`flex-1 p-4 rounded-xl border ${gameState?.currentTurn === gameState?.player2 ? 'bg-zinc-800/80 border-red-500/50' : 'bg-black/30 border-zinc-800'}`}>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Player 2</div>
                                <div className="text-2xl font-bold text-red-500">{gameState?.scores[1]}</div>
                                <div className="text-xs text-zinc-600 truncate">{gameState?.player2 ? gameState.player2.substring(0, 8) + '...' : 'Waiting...'}</div>
                            </div>
                        </div>

                        {canPlay ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-center text-sm font-bold animate-pulse">
                                YOUR TURN
                            </div>
                        ) : gameState?.status === 'Finished' ? (
                            <div className="bg-zinc-900/50 border border-zinc-800 text-zinc-500 p-3 rounded-xl text-center text-sm font-bold">
                                GAME OVER
                            </div>
                        ) : gameState?.status === 'Lobby' ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-xl text-center text-sm font-bold animate-pulse">
                                WAITING FOR OPPONENT TO JOIN...
                            </div>
                        ) : (
                            <div className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 p-3 rounded-xl text-center text-sm font-bold">
                                {isP1 || isP2 ? "OPPONENT'S TURN" : `GAME IN PROGRESS (${gameState?.currentTurn === gameState?.player1 ? "PLAYER 1" : "PLAYER 2"}'S TURN)`}
                            </div>
                        )}

                        {gameState?.status === 'Finished' && (
                            <div className="mt-4 text-center">
                                <div className="text-2xl font-bold text-white mb-2">
                                    {gameState.scores[0] > gameState.scores[1] ? 'PLAYER 1 WINS!' :
                                        gameState.scores[1] > gameState.scores[0] ? 'PLAYER 2 WINS!' : 'DRAW!'}
                                </div>
                                <button onClick={() => { setActiveGameId(''); setInputGameId(''); }} className="text-xs text-zinc-400 underline hover:text-white">
                                    Back to Lobby
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Game Board */}
            <div className="flex-1 min-h-[600px] flex items-center justify-center relative">
                {status === 'LOBBY' ? (
                    <div className="text-center space-y-4 opacity-50">
                        <div className="w-24 h-24 bg-zinc-900 rounded-full mx-auto flex items-center justify-center border border-zinc-800">
                            <Users size={48} className="text-zinc-700" />
                        </div>
                        <p className="text-zinc-500 font-mono text-sm tracking-widest">AWAITING CONNECTION</p>
                    </div>
                ) : (
                    <Board
                        gridSize={gameState?.gridSize || 8}
                        horizontalLines={hLines}
                        verticalLines={vLines}
                        squares={squareMap}
                        onLineClick={handleLineClick}
                        currentTurnColor={gameState?.currentTurn === gameState?.player1 ? P1_COLOR : P2_COLOR}
                        interactive={canPlay}
                    />
                )}
            </div>
        </div>
    );
};
