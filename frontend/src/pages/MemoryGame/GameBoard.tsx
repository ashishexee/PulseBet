import React, { useState } from 'react';
import type { Room, Card as CardType } from '../../hooks/useMemoryGame';
import { Card } from './Card';
import { Loader2 } from 'lucide-react';

interface GameBoardProps {
    room: Room;
    onPlayTurn: (id1: number, id2: number) => Promise<void>;
    loading: boolean;
    currentUser: string;
    onEndGame: (roomId: string) => Promise<void>;
}

export const GameBoard: React.FC<GameBoardProps> = ({ room, onPlayTurn, loading, currentUser, onEndGame }) => {
    const [selection, setSelection] = useState<number[]>([]);

    const handleCardClick = async (cardId: number) => {
        if (loading) {
            console.log("Ignored click: Loading");
            return;
        }
        if (selection.includes(cardId)) {
            console.log("Ignored click: Already selected");
            return;
        }

        if (room.currentTurn.toLowerCase() !== currentUser.toLowerCase()) {
            console.log(`Ignored click: Not your turn. Current: ${room.currentTurn}, You: ${currentUser}`);
            return;
        }

        const newSelection = [...selection, cardId];
        setSelection(newSelection);

        if (newSelection.length === 2) {
            // Submit move
            await onPlayTurn(newSelection[0], newSelection[1]);
            setSelection([]);
        }
    };

    const isRevealed = (card: CardType) => {
        if (card.state === 'REVEALED') return true;
        if (card.state === 'REMOVED') return true;
        if (selection.includes(card.id)) return true;

        // Last turn reveal logic:
        if (room.lastTurn) {
            if (room.lastTurn.card1.id === card.id || room.lastTurn.card2.id === card.id) {
                return true;
            }
        }
        return false;
    };



    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-xl shadow-2xl min-h-[600px]">
            {/* Status Header */}
            <div className="mb-4 flex gap-8 text-white text-lg font-bold">
                <div className={room.currentTurn === room.player1.owner ? "text-green-400" : "text-gray-500"}>
                    P1: {room.player1.score}
                    {room.currentTurn === room.player1.owner && " (Turn)"}
                </div>
                {room.player2 && (
                    <div className={room.currentTurn === room.player2.owner ? "text-green-400" : "text-gray-500"}>
                        P2: {room.player2.score}
                        {room.currentTurn === room.player2.owner && " (Turn)"}
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="text-xs text-gray-400 mb-2 font-mono bg-black/50 p-1 rounded inline-block">
                Debug: Cards Loaded: {room.cards.length} | State: {room.state}
            </div>

            {room.cards.length === 0 ? (
                <div className="text-red-400 font-mono p-4 border border-red-800 bg-red-900/20 rounded text-center">
                    <p className="font-bold">Error: Game Started but Deck is Empty.</p>
                    <p className="text-sm mt-2">Try ending the game and creating a new one.</p>
                </div>
            ) : (
                <div className={`grid grid-cols-4 gap-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {room.cards.map(card => {
                        let displayCard = card;
                        if (card.state === 'HIDDEN' && room.lastTurn) {
                            if (room.lastTurn.card1.id === card.id) {
                                displayCard = { ...card, imageId: room.lastTurn.card1.imageId };
                            } else if (room.lastTurn.card2.id === card.id) {
                                displayCard = { ...card, imageId: room.lastTurn.card2.imageId };
                            }
                        }
                        return (
                            <Card
                                key={card.id}
                                card={displayCard}
                                onClick={() => handleCardClick(card.id)}
                                disabled={loading || isRevealed(card)}
                                isSelected={selection.includes(card.id) || isRevealed(card)}
                                isLoading={loading && selection.includes(card.id)}
                            />
                        );
                    })}
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            )}

            {room.state === 'FINISHED' && (
                <div className="mt-8 text-2xl font-bold text-yellow-400">
                    Game Over!
                    {room.player1.score > (room.player2?.score || 0) ? " Player 1 Wins!" :
                        room.player1.score < (room.player2?.score || 0) ? " Player 2 Wins!" : " Draw!"}
                </div>
            )}

            <div className="mt-8">
                <button
                    onClick={() => onEndGame(room.roomId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                >
                    End Game
                </button>
            </div>
        </div>
    );
};
