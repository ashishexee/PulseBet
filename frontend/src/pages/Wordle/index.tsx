import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useWordle } from '../../hooks/useWordle';
import { Grid } from './components/Grid';
import { Keyboard } from './components/Keyboard';
import { RotateCcw, Play, Brain, Info } from 'lucide-react';
import { useLineraWallet } from '../../hooks/useLineraWallet';
import { GameOverlay } from '../../components/GameOverlay';

const WORDLE_RULES = (
    <div className="space-y-4">
        <div className="space-y-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Game Objective</h4>
            <p className="text-zinc-400 text-sm leading-relaxed">
                Decrypt the secret 5-letter word within 5 attempts. Logic and vocabulary are your only tools.
            </p>
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-black font-bold">A</div>
                <div className="text-xs text-zinc-400"><strong className="text-green-500">GREEN</strong> means the letter is correct and in the right spot.</div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-black font-bold">B</div>
                <div className="text-xs text-zinc-400"><strong className="text-yellow-500">YELLOW</strong> means the letter is in the word but wrong spot.</div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center text-zinc-400 font-bold">C</div>
                <div className="text-xs text-zinc-400"><strong className="text-zinc-500">GREY</strong> means the letter is not in the word.</div>
            </div>
        </div>

        <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">On-Chain Verification</p>
            <p className="text-white font-mono text-sm">Every guess is cryptographically verified.</p>
        </div>
    </div>
);

export const Wordle: React.FC = () => {
    const { gameSession, loading, startGame, submitGuess } = useWordle();
    const { isConnected, connect } = useLineraWallet();
    const [currentGuess, setCurrentGuess] = useState("");

    // const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleChar = useCallback((char: string) => {
        if (gameSession?.isOver) return;
        if (currentGuess.length < 5) {
            setCurrentGuess(prev => prev + char);
            // setErrorMsg(null);
        }
    }, [currentGuess, gameSession]);

    const handleDelete = useCallback(() => {
        if (gameSession?.isOver) return;
        setCurrentGuess(prev => prev.slice(0, -1));
        // setErrorMsg(null);
    }, [gameSession]);

    const handleEnter = useCallback(async () => {
        if (gameSession?.isOver) return;
        if (currentGuess.length !== 5) {
            return;
        }

        try {
            await submitGuess(currentGuess);
            setCurrentGuess("");
        } catch (e: any) {
            console.error("Submission error:", e);
            if (e.message && e.message.includes("Word not in dictionary")) {
                toast.error("Not a Valid Word");
            } else {
                toast.error("Transaction Failed");
            }
        }
    }, [currentGuess, gameSession, submitGuess]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const key = e.key.toUpperCase();
            if (key === 'ENTER') handleEnter();
            else if (key === 'BACKSPACE') handleDelete();
            else if (/^[A-Z]$/.test(key)) handleChar(key);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleChar, handleDelete, handleEnter]);
    if (gameSession) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-zinc-950 pt-10 flex flex-col items-center justify-between pb-8 relative overflow-hidden">
                <GameOverlay
                    isConnected={isConnected}
                    connect={connect}
                    gameId="wordle"
                    gameTitle="Wordle Protocol"
                    rules={WORDLE_RULES}
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-30">
                    <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-white/5 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-zinc-500/10 rounded-full blur-[128px]"></div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl px-4 z-10 relative">
                    <div className="w-full max-w-lg flex flex-col items-center">
                        <div className="mb-8 text-center space-y-4 relative w-full">
                            {/* errorMsg && (
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-max px-6 py-3 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-full text-red-500 font-bold tracking-widest text-xs animate-in slide-in-from-top-4 shadow-2xl flex items-center gap-2 z-50">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    {errorMsg}
                                </div>
                            ) */}

                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600">Wordle</span>
                                <span className="block text-sm font-mono text-zinc-500 tracking-[0.5em] mt-2 border-t border-zinc-800 pt-2 mx-12">PROTOCOL</span>
                            </h1>

                            <div className="flex items-center justify-center gap-3">
                                <div className="px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm rounded-full text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                    GUESSES <span className="text-white font-bold">{gameSession.attempts}/5</span>
                                </div>
                                {gameSession.isWon && (
                                    <div className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-500 tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                        SEQUENCE DECRYPTED
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative inline-block">
                            <Grid
                                guesses={gameSession.guesses}
                                currentGuess={currentGuess}
                                feedbackHistory={gameSession.feedbackHistory}
                                attempts={gameSession.attempts}
                            />

                            {gameSession.isOver && (
                                <div className="absolute md:left-[calc(100%+2rem)] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 md:translate-x-0 z-20 w-80 p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-xl text-center animate-in slide-in-from-left-4 fade-in duration-500 shadow-2xl">
                                    <h2 className={`text-4xl font-black mb-1 tracking-tighter ${gameSession.isWon ? 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600' : 'text-zinc-500'}`}>
                                        {gameSession.isWon ? "UNLOCKED" : "FAILED"}
                                    </h2>
                                    <p className="text-zinc-500 font-mono text-xs tracking-widest mb-8 uppercase">
                                        {gameSession.isWon ? "Protocol Synchronization Complete" : "Entropy limit reached"}
                                    </p>

                                    {!gameSession.isWon && (
                                        <div className="mb-8 flex flex-col items-center gap-2">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Target Sequence</span>
                                            <div className="text-3xl font-black text-white tracking-widest">{gameSession.targetWord}</div>
                                        </div>
                                    )}

                                    <button
                                        onClick={startGame}
                                        disabled={loading}
                                        className="group relative w-full px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold rounded-xl transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                        <span className="flex items-center justify-center gap-3">
                                            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
                                            <span>REBOOT SYSTEM</span>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full flex justify-center z-10 pb-8">
                    <Keyboard
                        onChar={handleChar}
                        onDelete={handleDelete}
                        onEnter={handleEnter}
                        guesses={gameSession.guesses}
                        feedbackHistory={gameSession.feedbackHistory}
                    />
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
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-950 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <GameOverlay
                isConnected={isConnected}
                connect={connect}
                gameId="wordle"
                gameTitle="Wordle Protocol"
                rules={WORDLE_RULES}
            />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                            <Brain className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs font-mono font-bold text-zinc-300 tracking-wider uppercase">Cognitive Protocol</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
                            WORDLE
                            <span className="block text-zinc-500">ON-CHAIN</span>
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-sm">
                            Decentralized linguistic decryption. Guess the target sequence in 5 attempts. Fully verified on Linera.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startGame}
                            disabled={loading}
                            className="group relative px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 w-fit"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-400 border-t-black"></span>
                            ) : (
                                <Play className="w-5 h-5 fill-black" />
                            )}
                            <span className="tracking-wide">INITIALIZE GAME</span>
                        </button>
                    </div>
                </div>


                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-zinc-800/20 to-transparent blur-3xl pointer-events-none"></div>

                    <div className="flex items-center gap-2 mb-6 text-white font-bold tracking-wide">
                        <Info className="w-5 h-5 text-zinc-400" /> DECRYPTION RULES
                    </div>

                    <div className="space-y-6">
                        {/* Rule 1 */}
                        <div className="space-y-2">
                            <div className="flex gap-2 mb-2">
                                {['P', 'U', 'L', 'S', 'E'].map((letter, i) => (
                                    <div key={i} className={`w-10 h-10 border-2 rounded flex items-center justify-center font-bold text-lg ${i === 0 ? 'bg-green-500 border-green-500 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-zinc-400">
                                <strong className="text-green-500">GREEN</strong> means the letter is in the correct spot.
                            </p>
                        </div>

                        {/* Rule 2 */}
                        <div className="space-y-2">
                            <div className="flex gap-2 mb-2">
                                {['C', 'H', 'A', 'I', 'N'].map((letter, i) => (
                                    <div key={i} className={`w-10 h-10 border-2 rounded flex items-center justify-center font-bold text-lg ${i === 2 ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-zinc-400">
                                <strong className="text-yellow-500">YELLOW</strong> means the letter is in the word but wrong spot.
                            </p>
                        </div>

                        {/* Rule 3 */}
                        <div className="space-y-2">
                            <div className="flex gap-2 mb-2">
                                {['B', 'L', 'O', 'C', 'K'].map((letter, i) => (
                                    <div key={i} className={`w-10 h-10 border-2 rounded flex items-center justify-center font-bold text-lg ${i === 4 ? 'bg-zinc-700 border-zinc-700 text-zinc-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                                        {letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-zinc-400">
                                <strong className="text-zinc-500">GREY</strong> means the letter is not in the word.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
