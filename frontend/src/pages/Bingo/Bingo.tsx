import { useState } from 'react';
import { Grid3x3, Trophy, Clock, Users, Copy, LogOut, ArrowRight } from 'lucide-react';
import { useBingoGame } from '../../hooks/useBingoGame';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { GameOverlay } from '../../components/GameOverlay';

const BINGO_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Compete against a friend in a decentralized P2P Bingo match. Validated on-chain for fairness.
            </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">How to Play</h4>
            <ul className="list-disc pl-4 space-y-2 text-zinc-400 text-sm marker:text-zinc-600">
                <li><strong>Host:</strong> Create a private room and share your Chain ID.</li>
                <li><strong>Join:</strong> Enter a friend's Chain ID to enter their lobby.</li>
                <li><strong>Turn-Based:</strong> Players take turns picking numbers to mark on the grid.</li>
                <li><strong>Win Condition:</strong> The first player to complete <strong>2 Lines</strong> (Row, Column, or Diagonal) wins.</li>
            </ul>
        </div>

        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Social Mode</p>
            <p className="text-white font-mono text-sm">Play for fun • No Tokens Required</p>
        </div>
    </div>
);

export const Bingo = () => {
    const {
        gameRoom,
        loading,
        lastError,
        chainId,
        createGame,
        joinGame,
        pickNumber,
        leaveGame,
        hardReset
    } = useBingoGame();

    const { isConnected, connect, disconnect } = useLineraWallet();

    const [playerName, setPlayerName] = useState('');
    const [hostIdInput, setHostIdInput] = useState('');
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

    const isInGame = !!gameRoom;
    const myPlayerIndex = gameRoom?.players.findIndex(p => p.chainId === chainId || p.chainId === `Non-owner chain ${chainId}`) ?? -1;
    const isMyTurn = isInGame && gameRoom?.currentTurnIndex !== null && gameRoom?.currentTurnIndex === myPlayerIndex;
    const isWaiting = isInGame && gameRoom && gameRoom.gameState === 'WaitingForPlayers';

    const calledNumbers = gameRoom?.calledNumbers || [];
    // Use the player's actual randomized board from the contract, or mock if not in game
    const bingoNumbers = isInGame && myPlayerIndex !== -1 && gameRoom?.players[myPlayerIndex]?.board
        ? gameRoom.players[myPlayerIndex].board
        : Array.from({ length: 25 }, (_, i) => i + 1);

    const handleCopyChainId = () => {
        if (chainId) {
            navigator.clipboard.writeText(chainId);
            alert("Chain ID copied! Share this with your friend.");
        }
    };

    const handleCreate = () => {
        if (!playerName.trim()) return alert("Enter a name first!");
        createGame(playerName);
    };

    const handleJoin = () => {
        if (!playerName.trim() || !hostIdInput.trim()) return alert("Enter name and Host ID.");
        joinGame(hostIdInput.trim(), playerName);
    };

    const handleNumberClick = (number: number) => {
        if (!isInGame || !isMyTurn || calledNumbers.includes(number)) return;
        setSelectedNumber(number);
    };

    const handleCallNumber = async () => {
        if (selectedNumber && isMyTurn) {
            await pickNumber(selectedNumber);
            setSelectedNumber(null);
        }
    };

    const getNumberStatus = (number: number) => {
        if (calledNumbers.includes(number)) return 'called';
        if (selectedNumber === number) return 'selected';
        return 'available';
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto p-4 lg:p-8 min-h-[700px] items-start justify-center animate-fade-in font-sans selection:bg-white selection:text-black relative">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="bingo"
                gameTitle="P2P Bingo"
                rules={BINGO_RULES}
            />

            {/* LEFT PANEL: Controls & Info */}
            <div className="w-full lg:w-[400px] bg-zinc-900/50 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-6 shadow-2xl border border-zinc-800/50 relative overflow-hidden">

                {/* Header */}
                <div className="space-y-1 border-b border-zinc-800 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950/50 mb-2">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">P2P Protocol</span>
                        </div>
                        {isConnected && (
                            <button onClick={disconnect} className="text-[10px] text-red-500 hover:underline">LOGOUT</button>
                        )}
                    </div>

                    <h2 className="text-3xl font-bold tracking-tighter text-white">Bingo</h2>
                    <p className="text-zinc-500 text-sm">Host your own room or join a friend.</p>
                </div>
                {!isConnected ? (
                    <div className="py-10 text-center space-y-4">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto" />
                        <h3 className="text-white font-bold">Wallet Not Connected</h3>
                        <button
                            onClick={connect}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-sm"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : !isInGame ? (
                    /* --- LOBBY VIEW --- */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* 1. Name Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Name</label>
                            <input
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                placeholder="Enter nickname..."
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-white outline-none transition-colors"
                            />
                        </div>

                        {/* 2. Create Room */}
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-3">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-white" />
                                Host a Game
                            </h4>
                            <p className="text-xs text-zinc-500">Create a room on your chain and share your ID.</p>
                            <button
                                onClick={handleCreate}
                                disabled={loading || !playerName}
                                className="w-full bg-gradient-to-r from-white to-zinc-300 hover:from-zinc-100 hover:to-zinc-400 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50 text-xs uppercase tracking-wider shadow-lg"
                            >
                                {loading ? 'Creating...' : 'Create Private Room'}
                            </button>
                        </div>

                        {/* 3. Join Room */}
                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-3">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-zinc-400" />
                                Join a Friend
                            </h4>
                            <input
                                value={hostIdInput}
                                onChange={e => setHostIdInput(e.target.value)}
                                placeholder="Paste Host Chain ID..."
                                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-blue-500 outline-none"
                            />
                            <button
                                onClick={handleJoin}
                                disabled={loading || !playerName || !hostIdInput}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                Join Game <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Your ID */}
                        <div className="pt-4 border-t border-zinc-800">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Your Chain ID (Share to Host)</label>
                            <button
                                onClick={handleCopyChainId}
                                className="w-full bg-black/50 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-all group"
                            >
                                <span className="truncate pr-4 font-mono">{chainId}</span>
                                <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* --- GAME INFO VIEW --- */
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">

                        {/* Room Info */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Room Info</label>
                            <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-zinc-500 text-xs">Host ID</span>
                                    <span className="text-white font-mono text-[10px] truncate w-24" title={gameRoom?.hostChainId}>
                                        {gameRoom?.hostChainId.slice(0, 8)}...
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-xs">Status</span>
                                    <span className={`text-xs font-bold ${isWaiting ? 'text-white animate-pulse' : 'text-zinc-300'}`}>
                                        {gameRoom?.gameState === 'WaitingForPlayers' ? 'WAITING FOR PLAYERS' : gameRoom?.gameState}
                                    </span>
                                </div>
                            </div>

                            {/* Players List */}
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Players</label>
                                {gameRoom?.players.map((p, i) => (
                                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${p.isWinner ? 'border-yellow-500 bg-yellow-900/10' : 'border-zinc-800 bg-zinc-900'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white border border-zinc-700">
                                                {p.name[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm text-zinc-300">{p.name} {p.chainId === chainId && '(You)'}</span>
                                        </div>
                                        {p.isWinner && <Trophy className="w-3 h-3 text-white" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-zinc-800 space-y-3">
                            {/* Turn Indicator */}
                            {!isWaiting && gameRoom?.gameState !== 'Ended' && (
                                <div className={`p-4 rounded-xl border mb-4 ${isMyTurn ? 'bg-white/10 border-white' : 'bg-black/50 border-zinc-800'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-wider text-zinc-400">Current Turn</span>
                                        <div className="flex items-center gap-2">
                                            {isMyTurn && <Clock className="w-4 h-4 text-white animate-pulse" />}
                                            <span className={`font-mono text-sm ${isMyTurn ? 'text-white font-bold' : 'text-zinc-500'}`}>
                                                {isMyTurn ? 'YOUR TURN' : 'OPPONENT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Call Number Action */}
                            {selectedNumber && isMyTurn && (
                                <div className="bg-white/10 border border-white p-4 rounded-xl animate-in zoom-in-95">
                                    <div className="text-center">
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Selected Number</p>
                                        <p className="text-white font-mono text-4xl font-bold">{selectedNumber}</p>
                                        <button
                                            onClick={handleCallNumber}
                                            disabled={loading}
                                            className="mt-4 w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
                                        >
                                            {loading ? 'Calling...' : 'Call Number'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={leaveGame}
                                className="w-full bg-zinc-900 hover:bg-red-900/20 text-zinc-500 hover:text-red-500 font-bold py-3 rounded-xl border border-zinc-800 hover:border-red-900 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 group"
                            >
                                <LogOut className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                                Leave Game
                            </button>
                        </div>
                    </div>
                )}

                {lastError && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg animate-in slide-in-from-bottom-2">
                        <p className="text-[10px] text-red-400 font-mono break-all">{lastError}</p>
                        <button onClick={() => hardReset()} className="mt-2 text-[10px] text-red-300 underline">Reset Local State</button>
                    </div>
                )}

                {isConnected && (
                    <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px] font-bold text-zinc-500">
                        <span className="uppercase tracking-widest flex items-center gap-2">
                            Connected
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-white font-mono text-xs">Online</span>
                        </div>
                    </div>
                )}

            </div>

            {/* RIGHT PANEL: Game Board */}
            <div className="flex-1 bg-zinc-900/30 rounded-3xl p-8 lg:p-12 relative flex flex-col items-center justify-center shadow-2xl border border-zinc-800 w-full min-h-[700px] overflow-hidden">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                {/* Bingo Instructions & Winning Patterns */}
                {!isInGame ? (
                    <div className="flex flex-col h-full justify-center space-y-8 max-w-4xl mx-auto px-6 animate-in fade-in zoom-in-95 duration-1000 ease-out">

                        {/* Header - Minimalist & Premium */}
                        <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 tracking-tighter">
                                HOW TO PLAY
                            </h3>
                            <p className="text-zinc-400 text-sm font-medium tracking-wide">
                                CLASSIC STRATEGY • P2P PROTOCOL
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">

                            {/* Left: Rules - "The Book" Style */}
                            <div className="group bg-zinc-950/40 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)] flex flex-col justify-center">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-zinc-800 pb-4">
                                    <Trophy className="w-4 h-4 text-white" />
                                    <span>Rules of Engagement</span>
                                </h4>
                                <ul className="space-y-5 text-sm">
                                    {[
                                        { step: "01", text: "Receive your unique 5×5 quantum grid." },
                                        { step: "02", text: "Take turns broadcasting numbers." },
                                        { step: "03", text: "Mark numbers to forge your path." },
                                        { step: "04", text: "First to complete 2 lines." }
                                    ].map((rule, i) => (
                                        <li key={i} className="flex items-center gap-4 group/item">
                                            <span className="font-mono text-zinc-600 font-bold text-xs border border-zinc-800 rounded px-1.5 py-0.5 group-hover/item:text-white group-hover/item:border-zinc-600 transition-colors">
                                                {rule.step}
                                            </span>
                                            <span className="text-zinc-400 group-hover/item:text-zinc-200 transition-colors font-medium">
                                                {rule.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right: Winning Patterns - Interactive Visuals */}
                            <div className="group bg-zinc-950/40 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.05)]">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-widest border-b border-zinc-800 pb-4">
                                    <Grid3x3 className="w-4 h-4 text-white" />
                                    <span>Victory Patterns</span>
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Horizontal", check: (i: number) => Math.floor(i / 5) === 2 },
                                        { label: "Vertical", check: (i: number) => i % 5 === 2 },
                                        { label: "Diagonal ↘", check: (i: number) => Math.floor(i / 5) === i % 5 },
                                        { label: "Diagonal ↙", check: (i: number) => Math.floor(i / 5) + (i % 5) === 4 }
                                    ].map((pattern, idx) => (
                                        <div key={idx} className="space-y-2 p-3 rounded-xl bg-black/40 border border-zinc-800/50 hover:bg-zinc-900/40 transition-colors group/grid">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center group-hover/grid:text-white transition-colors">
                                                {pattern.label}
                                            </p>
                                            <div className="grid grid-cols-5 gap-0.5 opacity-60 group-hover/grid:opacity-100 transition-opacity">
                                                {[...Array(25)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`aspect-square rounded-[1px] ${pattern.check(i)
                                                            ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                                            : 'bg-zinc-800/50'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Status */}
                        <div className="pt-2 text-center animate-pulse">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                System Online • Ready to Initialize
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Active Game Board */
                    <>
                        {/* Winner Overlay */}
                        {gameRoom?.winnerName && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-500">
                                <Trophy className="w-20 h-20 text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce" />
                                <div className="text-xs font-bold text-zinc-400 tracking-widest uppercase mb-2">Winner</div>
                                <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-8">{gameRoom.winnerName}</div>
                                <div className="text-2xl font-bold text-zinc-400 font-mono border border-zinc-800 rounded-xl px-6 py-3 bg-black/50">
                                    Game Over
                                </div>
                                <button onClick={leaveGame} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                                    Back to Lobby
                                </button>
                            </div>
                        )}

                        {/* Waiting Overlay */}
                        {isWaiting && (
                            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 border-4 border-zinc-800 border-t-yellow-500 rounded-full animate-spin"></div>
                                </div>
                                <h3 className="text-xl font-bold text-white animate-pulse">Waiting for Opponent...</h3>
                                <p className="text-zinc-500 text-sm mt-2">Share your Chain ID so they can join!</p>
                            </div>
                        )}

                        {/* Called Numbers Badge */}
                        <div className="absolute top-6 right-8 z-30 bg-black/80 backdrop-blur border border-zinc-800 px-4 py-2 rounded-xl shadow-lg">
                            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Called</span>
                            <span className="text-white font-mono font-bold text-xl ml-3">{calledNumbers.length}/25</span>
                        </div>

                        {/* 5x5 Bingo Grid */}
                        <div className={`grid grid-cols-5 gap-3 w-full max-w-[600px] aspect-square relative z-10 transition-opacity duration-500 ${isWaiting ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
                            {bingoNumbers.map((number) => {
                                const status = getNumberStatus(number);
                                const isCalled = status === 'called';
                                const isSelected = status === 'selected';
                                const isClickable = isMyTurn && !isCalled && !gameRoom?.winnerName;

                                return (
                                    <button
                                        key={number}
                                        disabled={!isClickable}
                                        onClick={() => handleNumberClick(number)}
                                        className={`
                                            rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center outline-none select-none w-full h-full shadow-lg
                                            ${isCalled
                                                ? 'bg-white border-2 border-white scale-95 shadow-inner'
                                                : isSelected
                                                    ? 'bg-white/20 border-2 border-white scale-105 z-20 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                                    : isClickable
                                                        ? 'bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 hover:-translate-y-1 active:scale-95'
                                                        : 'bg-zinc-800/50 border border-zinc-900 opacity-40 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <span className={`text-2xl font-bold font-mono ${isCalled ? 'text-black' : isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                            {number}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full animate-pulse opacity-20"></div>
                        </div>
                    </div>
                    <div className="mt-8 font-mono text-xs tracking-[0.2em] text-zinc-500 animate-pulse">
                        PROCESSING TRANSACTION...
                    </div>
                </div>
            )}
        </div>
    );
};
