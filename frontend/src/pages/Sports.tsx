import { useState } from 'react';
import { Trophy, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSportsGame, type LiveBet } from '../hooks/useSports';
import { useLineraWallet } from '../hooks/useLineraWallet';

export default function Sports() {
    const { liveBets, loading, placeBet, claimWinnings } = useSportsGame();
    const { isConnected, connect } = useLineraWallet();

    const [amounts, setAmounts] = useState<Record<string, string>>({});

    const handleAmountChange = (id: string, value: string) => {
        if (Number(value) < 0) return;
        setAmounts(prev => ({ ...prev, [id]: value }));
    };

    const formatOdds = (odds: number) =>
        odds > 50 ? (odds / 100).toFixed(2) : odds.toFixed(2);

    const isExpired = (endTime: number) =>
        Date.now() * 1000 > endTime;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Trophy className="text-blue-500" />
                        Live Sports Betting
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Real-time AI generated markets from live sports events
                    </p>
                </div>

                {!isConnected && (
                    <button
                        onClick={connect}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                    >
                        Connect Wallet
                    </button>
                )}
            </div>

            {/* Bets Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveBets.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-[#0f1520] rounded-2xl border border-[#2a3441]">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                            <Clock className="w-12 h-12 text-gray-600" />
                            <p className="text-gray-400 text-lg">
                                Waiting for live events from Oracle...
                            </p>
                        </div>
                    </div>
                ) : (
                    liveBets.map(bet => (
                        <BetCard
                            key={bet.id}
                            bet={bet}
                            amount={amounts[bet.id] || ''}
                            onAmountChange={val => handleAmountChange(bet.id, val)}
                            onPlaceBet={placeBet}
                            onClaim={claimWinnings}
                            loading={loading}
                            isConnected={isConnected}
                            formatOdds={formatOdds}
                            isExpired={isExpired(bet.endTime)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function BetCard({
    bet,
    amount,
    onAmountChange,
    onPlaceBet,
    onClaim,
    loading,
    isConnected,
    formatOdds,
    isExpired
}: {
    bet: LiveBet;
    amount: string;
    onAmountChange: (v: string) => void;
    onPlaceBet: (id: string, amt: number, pred: boolean) => void;
    onClaim: (id: string) => void;
    loading: boolean;
    isConnected: boolean;
    formatOdds: (o: number) => string;
    isExpired: boolean;
}) {
    const isOpen = bet.status === 'Open' && !isExpired;
    const isResolved = bet.status === 'Resolved';
    const betAmount = Number(amount);

    return (
        <div
            className={`rounded-2xl border p-6 flex flex-col gap-4 transition-all
            ${
                isResolved
                    ? 'border-green-500/30 bg-green-900/10'
                    : 'border-[#2a3441] bg-[#0f1520]'
            } hover:border-blue-500/50`}
        >
            {/* Status */}
            <div className="flex justify-between">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${
                        isOpen
                            ? 'bg-green-500/20 text-green-400 animate-pulse'
                            : isResolved
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-700 text-gray-400'
                    }`}
                >
                    {isOpen ? 'Live Now' : bet.status}
                </span>

                <span className="text-yellow-400 font-mono font-bold text-xl">
                    {formatOdds(bet.odds)}x
                </span>
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold text-white min-h-[3.5rem]">
                {bet.question}
            </h3>

            {/* Actions */}
            <div className="mt-auto space-y-3">
                {isOpen ? (
                    <>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={e => onAmountChange(e.target.value)}
                                placeholder="Bet Amount"
                                className="w-full bg-[#070b11] border border-[#2a3441] rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                            />
                            <span className="absolute right-4 top-3 text-gray-500 text-sm font-bold">
                                PULSE
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onPlaceBet(bet.id, betAmount, true)}
                                disabled={!isConnected || loading || betAmount <= 0}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
                            >
                                YES
                            </button>

                            <button
                                onClick={() => onPlaceBet(bet.id, betAmount, false)}
                                disabled={!isConnected || loading || betAmount <= 0}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
                            >
                                NO
                            </button>
                        </div>
                    </>
                ) : isResolved ? (
                    <>
                        <div
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold
                            ${
                                bet.result
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                            {bet.result ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            Result: {bet.result ? 'YES' : 'NO'}
                        </div>

                        <button
                            onClick={() => onClaim(bet.id)}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex justify-center gap-2"
                        >
                            <Trophy size={18} />
                            Claim Winnings
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-4 text-gray-500 bg-[#070b11] rounded-xl">
                        <AlertCircle size={18} />
                        Betting Closed – Awaiting Result
                    </div>
                )}
            </div>
        </div>
    );
}
