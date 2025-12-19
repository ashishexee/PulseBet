import { Search, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const games = [
    { id: 1, title: 'Sweet Bonanza 1000', provider: 'Pragmatic Play', players: 879, image: 'linear-gradient(180deg, #ff9a9e 0%, #ff6a88 100%)' },
    { id: 2, title: 'Big Bass Splash', provider: 'Pragmatic Play', players: 601, image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 3, title: 'Million X', provider: 'Titan Gaming', players: 150, image: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' },
    { id: 4, title: 'Le Rapper', provider: 'Hacksaw Gaming', players: 333, image: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)' },
    { id: 5, title: 'Gates of Olympus 1000', provider: 'Pragmatic Play', players: 708, image: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
    { id: 6, title: 'Jaws of Justice', provider: 'Hacksaw Gaming', players: 353, image: 'linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)' },
];

export const GameGrid = () => {
    return (
        <div>
            {/* Search Bar Container */}
            <div className="flex flex-wrap gap-4 mb-8 bg-[#0f212e] p-1 rounded-sm border border-[#213743]">
                <div className="relative flex-1 flex items-center">
                    {/* Casino Dropdown Trigger */}
                    <button className="h-[46px] px-6 flex items-center gap-2 bg-[#1a2c38] hover:bg-[#213743] rounded-[4px] text-sm font-semibold text-white transition-colors mr-1">
                        Casino <span className="text-[var(--text-secondary)] text-[10px]">▼</span>
                    </button>

                    {/* Search Input */}
                    <div className="flex-1 flex items-center h-full px-4 relative">
                        <Search className="text-[var(--text-secondary)] mr-3" size={18} />
                        <input
                            type="text"
                            placeholder="Search your game"
                            className="bg-transparent border-none outline-none text-white h-full w-full placeholder:text-[#557086] font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Trending Games Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Play size={18} className="text-white fill-white" />
                    <h3 className="text-xl font-bold text-white">Trending Games</h3>
                </div>
                <div className="flex gap-2">
                    <button className="w-9 h-9 flex items-center justify-center bg-[#213743] rounded-full hover:bg-[#2f4553] transition-colors text-white disabled:opacity-50">
                        <ChevronLeft size={20} />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center bg-[#213743] rounded-full hover:bg-[#2f4553] transition-colors text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {games.map((game) => (
                    <div key={game.id} className="group cursor-pointer">
                        <div
                            className="aspect-[2/3] rounded-xl mb-3 relative overflow-hidden transition-transform group-hover:-translate-y-1.5 shadow-lg bg-[#213743]"
                            style={{ background: game.image }}
                        >
                            {/* Simple text overlay to simulate poster art */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                <span className="font-extrabold text-black/40 text-2xl leading-none uppercase mix-blend-overlay">{game.title}</span>
                            </div>

                            {/* Hover Toggle */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                <button className="bg-[var(--primary-blue)] text-white px-8 py-2.5 rounded-[4px] font-bold shadow-lg transform scale-95 group-hover:scale-100 transition-all hover:bg-[var(--primary-blue-hover)]">
                                    Play
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] pl-1">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e701] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e701]"></span>
                            </span>
                            <span className="text-white font-semibold">{game.players}</span> playing
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
