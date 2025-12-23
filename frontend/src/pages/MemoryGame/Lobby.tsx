import React, { useState } from 'react';
import { useMemoryGame } from '../../hooks/useMemoryGame';
import { Loader2, Users, Lock, Play } from 'lucide-react';
import { useLineraWallet } from '../../hooks/useLineraWallet';

interface LobbyProps {
    hook: ReturnType<typeof useMemoryGame>;
}

export const Lobby: React.FC<LobbyProps> = ({ hook }) => {
    const { publicRooms, createRoom, joinRoom, loading, refreshLobby } = hook;
    const { owner } = useLineraWallet();
    const [joinCode, setJoinCode] = useState('');
    const [privateRoomId, setPrivateRoomId] = useState('');

    return (
        <div className="max-w-4xl mx-auto p-6 text-white bg-gray-900 rounded-xl shadow-2xl">
            <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Memory Game Lobby
            </h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Create Game Section */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Play className="text-green-400" /> Create Game
                    </h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => createRoom('Public')}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading && <Loader2 className="animate-spin" />}
                            Create Public Game
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-gray-800 px-2 text-gray-400">Or Private</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Set Password (Optional)"
                                className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                            <button
                                onClick={() => createRoom('Private', joinCode || undefined)}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 px-4 rounded font-bold"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>

                {/* Join Private Section */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Lock className="text-yellow-400" /> Join Private
                    </h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Room ID"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            value={privateRoomId}
                            onChange={(e) => setPrivateRoomId(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Room Password (Private Games Only)"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                        />
                        <button
                            onClick={() => joinRoom(privateRoomId, joinCode)}
                            disabled={loading || !privateRoomId}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                        >
                            Join By ID
                        </button>
                    </div>
                </div>
            </div>

            {/* Public Rooms List */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" /> Public Games
                    </h2>
                    <button onClick={() => refreshLobby()} className="text-sm text-gray-400 hover:text-white">
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4">
                    {publicRooms.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">No public games found. Create one!</div>
                    ) : (
                        publicRooms.map(room => {
                            const isMyRoom = room.player1.owner === owner;

                            return (
                                <div key={room.roomId} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-gray-500 transition-colors">
                                    <div>
                                        <div className="flex justify-between items-center text-sm bg-black/40 p-2 rounded gap-2">
                                            <span className="text-gray-400 truncate flex-1">ID: {room.roomId}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(room.roomId);
                                                }}
                                                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors"
                                                title="Copy Chain ID"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <div className="font-bold text-lg mt-1">Room {room.roomId.slice(0, 8)}...</div>
                                        <div className="text-sm text-gray-400">Host: {isMyRoom ? "You" : room.player1.owner.slice(0, 8)}...</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">{room.state}</span>

                                        {isMyRoom ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => joinRoom(room.roomId)}
                                                    disabled={loading}
                                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold"
                                                >
                                                    Resume
                                                </button>
                                                <button
                                                    onClick={() => hook.endGame(room.roomId)}
                                                    disabled={loading}
                                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
                                                >
                                                    End
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => joinRoom(room.roomId)}
                                                disabled={loading}
                                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
