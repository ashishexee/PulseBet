import React from 'react';
import { useMemoryGame } from '../../hooks/useMemoryGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { Lobby } from './Lobby';
import { GameBoard } from './GameBoard';
import { Copy } from 'lucide-react';

export const MemoryGame: React.FC = () => {
    const hook = useMemoryGame();
    const { gameState } = hook;
    const { owner, disconnect } = useLineraWallet();

    if (!owner) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
                    <p className="text-gray-400">Please connect your Linera wallet to play.</p>
                </div>
            </div>
        );
    }

    if (!gameState) {
        if (hook.activeRoomId) {
            return (
                <div className="flex flex-col items-center justify-center h-screen text-white space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-2xl font-bold">Connecting to Room...</div>
                    <p className="text-gray-400 max-w-md text-center">
                        Synchronizing game state with the Linera network.
                        <br /><span className="text-sm text-gray-500">If this takes longer than 10s, the network might be congested.</span>
                    </p>

                    {hook.error && (
                        <div className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm max-w-md text-center">
                            Last Error: {hook.error}
                        </div>
                    )}

                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => disconnect()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold transition-colors"
                        >
                            Reset Network (Fix Sync)
                        </button>
                        <button
                            onClick={() => hook.setGameId(null)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-500 font-mono text-center">
                        <p>App ID: {import.meta.env.VITE_MEMORY_GAME_APP_ID?.slice(0, 10)}...{import.meta.env.VITE_MEMORY_GAME_APP_ID?.slice(-8)}</p>
                        <p>Node: {import.meta.env.VITE_LINERA_NODE_URL || "Default Validator Set"}</p>
                    </div>
                </div>
            );
        }
        return <Lobby hook={hook} />;
    }

    if (gameState.state === 'WAITING') {
        const isHost = gameState.player1.owner.toLowerCase() === owner.toLowerCase();
        const hasPlayer2 = !!gameState.player2;

        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] text-white space-y-8">
                <div className="text-4xl font-bold text-blue-400">
                    {hasPlayer2 ? 'Lobby Ready' : 'Waiting for Player 2...'}
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-2xl px-4">
                    {/* Player 1 Card */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-blue-500/50 flex flex-col items-center">
                        <div className="text-xl font-bold mb-2 text-blue-400">Player 1 (Host)</div>
                        <div className="font-mono text-sm text-gray-400 break-all text-center">
                            {gameState.player1.owner === owner ? '(You)' : gameState.player1.owner}
                        </div>
                        <div className="mt-4 px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-semibold">
                            READY
                        </div>
                    </div>

                    {/* Player 2 Card */}
                    <div className={`bg-gray-800 p-6 rounded-xl border ${hasPlayer2 ? 'border-purple-500/50' : 'border-gray-700 border-dashed'} flex flex-col items-center justify-center min-h-[160px]`}>
                        {hasPlayer2 ? (
                            <>
                                <div className="text-xl font-bold mb-2 text-purple-400">Player 2</div>
                                <div className="font-mono text-sm text-gray-400 break-all text-center">
                                    {gameState.player2?.owner === owner ? '(You)' : gameState.player2?.owner}
                                </div>
                                <div className="mt-4 px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-xs font-semibold">
                                    READY
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-500 animate-pulse text-center">
                                <p>Waiting for opponent to join...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center max-w-md w-full">
                    <p className="text-gray-400 mb-2">Room ID</p>
                    <div className="flex items-center gap-2 bg-black rounded p-3 font-mono text-sm break-all justify-center">
                        {gameState.roomId}
                        <button
                            onClick={() => navigator.clipboard.writeText(gameState.roomId)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                    {gameState.roomCode && (
                        <div className="mt-4">
                            <p className="text-gray-400 mb-2">Access Code</p>
                            <div className="text-xl font-bold text-yellow-400">{gameState.roomCode}</div>
                        </div>
                    )}
                </div>

                {hasPlayer2 ? (
                    <div className="mt-8">
                        {isHost ? (
                            <button
                                onClick={() => hook.startGame(gameState.roomId)}
                                disabled={hook.loading}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg shadow-blue-900/20"
                            >
                                {hook.loading ? 'Starting Game...' : 'START GAME'}
                            </button>
                        ) : (
                            <div className="text-center animate-pulse">
                                <p className="text-xl font-semibold text-gray-300">Waiting for Host to Start...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => window.location.reload()}
                        className="text-gray-500 hover:text-white underline mt-4"
                    >
                        Cancel / Back
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-4 flex justify-between items-center text-white px-4">
                <h1 className="text-2xl font-bold">Memory Duel</h1>
                <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-3 py-1.5 rounded-full">
                    <span>Room: {gameState.roomId?.slice(0, 8)}...</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(gameState.roomId)}
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Copy Room ID"
                    >
                        <Copy size={14} />
                    </button>
                </div>
            </div>
            <GameBoard
                room={gameState}
                onPlayTurn={(id1, id2) => hook.playTurn(gameState.roomId, [id1, id2])}
                loading={hook.loading}
                currentUser={owner}
                onEndGame={hook.endGame}
            />
        </div>
    );
};
