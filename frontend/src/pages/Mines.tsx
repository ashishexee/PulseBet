import { useState } from 'react';
import { Gem } from 'lucide-react';
import { useMinesGame } from '../hooks/useMinesGame';
import { useLineraWallet } from '../hooks/useLineraWallet';

export const Mines = () => {
    // Game Hooks
    const { gameState, balance, loading, startGame, revealTile, cashOut } = useMinesGame();
    const { isConnected, connect } = useLineraWallet();

    // Local UI State
    const [betAmount, setBetAmount] = useState<number>(0);
    const [minesCount, setMinesCount] = useState<number>(3);

    // Derived UI State from Blockchain Data
    const isGameActive = gameState?.result === 'Active';
    const revealedTiles = gameState?.revealedTiles || [];
    const isGameOver = gameState?.result === 'Lost';

    // Determine tile state
    const getTileContent = (id: number) => {
        if (!revealedTiles.includes(id)) {
            // Show mine if game over (and lost), otherwise generic cover
            if (isGameOver && gameState?.result === 'Lost') {
                // In a real app, we would fetch the full mine locations here if the contract reveals them
                // For now, we only show what we revealed.
                return null;
            }
            return null;
        }

        // If it's a revealed tile, it must be a Gem unless it was the one that killed us
        // Simplified Logic: The contract only adds "safe" tiles to revealed_tiles if game is active/won.
        // If we lost, the last revealed tile MIGHT be the bomb. 
        // We need the `mine_indices` from the service to show all bombs on loss.
        return <Gem className="w-8 h-8 text-[#00e701] drop-shadow-[0_0_15px_rgba(0,231,1,0.6)] animate-bounce" />;
    };


    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[600px]">
            {/* Control Panel */}
            <div className="w-full lg:w-[350px] bg-[#213545] rounded-lg p-4 flex flex-col gap-4">
                {/* Bet Amount Input */}
                <div className="bg-[#0f212e] p-2 rounded-md border border-[#2f4553] flex flex-col gap-1 relative group hover:border-[#557086] transition-colors">
                    <label className="text-[12px] font-bold text-[#b7bfd0] pl-1">Bet Amount</label>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                                disabled={isGameActive}
                                className="bg-transparent text-white font-bold w-full outline-none"
                            />
                            <span className="text-yellow-500 font-bold">₿</span>
                        </div>
                        <div className="flex gap-1">
                            <button className="bg-[#2f4553] text-[#b1bad3] text-xs font-bold px-3 py-1.5 rounded hover:bg-[#3c5566] transition-colors" onClick={() => setBetAmount(betAmount / 2)} disabled={isGameActive}>½</button>
                            <button className="bg-[#2f4553] text-[#b1bad3] text-xs font-bold px-3 py-1.5 rounded hover:bg-[#3c5566] transition-colors" onClick={() => setBetAmount(betAmount * 2)} disabled={isGameActive}>2x</button>
                        </div>
                    </div>
                </div>

                {/* Mines Count Selection */}
                <div className="bg-[#0f212e] p-2 rounded-md border border-[#2f4553] flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#b7bfd0] pl-1">Mines</label>
                    <select
                        value={minesCount}
                        onChange={(e) => setMinesCount(parseInt(e.target.value))}
                        disabled={isGameActive}
                        className="bg-transparent text-white font-bold w-full outline-none cursor-pointer"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 24].map(num => (
                            <option key={num} value={num} className="bg-[#0f212e]">{num}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1"></div>

                {/* Action Button */}
                {!isConnected ? (
                    <button onClick={connect} className="w-full bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white font-bold py-4 rounded-[4px] shadow-lg transition-transform active:scale-[0.98]">
                        Connect Wallet
                    </button>
                ) : isGameActive ? (
                    <button onClick={cashOut} disabled={loading} className="w-full bg-[#00e701] hover:bg-[#00c201] text-[#0f212e] font-bold py-4 rounded-[4px] shadow-lg transition-transform active:scale-[0.98]">
                        {loading ? "Processing..." : `Cash Out (${(betAmount * (gameState?.currentMultiplier || 1)).toFixed(4)})`}
                    </button>
                ) : (
                    <button onClick={() => startGame(betAmount, minesCount)} disabled={loading} className="w-full bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white font-bold py-4 rounded-[4px] shadow-lg transition-transform active:scale-[0.98]">
                        {loading ? "Starting..." : "Bet"}
                    </button>
                )}

                {/* Local Wallet Balance Display */}
                {isConnected && (
                    <div className="text-center text-sm font-bold text-[#b1bad3]">
                        Balance: {balance}
                    </div>
                )}

            </div>

            {/* Game Grid Area */}
            <div className="flex-1 bg-[#0f212e] rounded-lg p-6 lg:p-12 relative flex flex-col items-center justify-center">

                {/* Game Grid */}
                <div className="grid grid-cols-5 gap-3 w-full max-w-[500px] aspect-square">
                    {Array.from({ length: 25 }).map((_, i) => (
                        <button
                            key={i}
                            disabled={!isGameActive || revealedTiles.includes(i) || loading}
                            onClick={() => revealTile(i)}
                            className={`
                                    rounded-lg transition-all duration-200 relative overflow-hidden active:scale-95 flex items-center justify-center
                                    ${revealedTiles.includes(i)
                                    ? 'bg-[#071824] border-b-0 translate-y-1' // Revealed State
                                    : 'bg-[#2f4553] hover:bg-[#3c5566] hover:-translate-y-1 border-b-4 border-[#1a2c38] shadow-lg' // Hidden State
                                }
                                    ${!isGameActive && !revealedTiles.includes(i) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                        >
                            {revealedTiles.includes(i) && getTileContent(i)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
