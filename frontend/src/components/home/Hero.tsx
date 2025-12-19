import { Gamepad2, Dna } from 'lucide-react'; // Using approximate icons

export const Hero = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-6 mb-12 bg-[#00141e] rounded-xl p-8 md:p-12 relative overflow-hidden">
            {/* Background decoration (Abstract shape) - Simplified as gradient for now */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#0f212e] to-transparent opacity-50 pointer-events-none" />

            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
                    World's Largest Online <br />
                    Casino and Sportsbook
                </h2>
            </div>

            {/* Right Content - Cards */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-8 lg:mt-0">
                {/* Casino Card */}
                <div className="bg-[#1a2c38] rounded-xl overflow-hidden group cursor-pointer relative transition-transform hover:-translate-y-1 shadow-xl">
                    <div className="h-[180px] bg-[url('https://cdn.stake.com/heroes/casino-hero.jpg')] bg-cover bg-center flex items-end">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2c38] to-transparent opacity-80" />
                        {/* Fallback visual if no image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay" />
                    </div>
                    <div className="p-4 flex justify-between items-center bg-[#1a2c38]">
                        <div className="flex items-center gap-3 font-bold text-lg">
                            <Gamepad2 size={20} className="text-[var(--text-secondary)]" /> Casino
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#00e701]">
                            <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse"></span>
                            49,722
                        </div>
                    </div>
                </div>

                {/* Sports Card */}
                <div className="bg-[#1a2c38] rounded-xl overflow-hidden group cursor-pointer relative transition-transform hover:-translate-y-1 shadow-xl">
                    <div className="h-[180px] bg-[url('https://cdn.stake.com/heroes/sports-hero.jpg')] bg-cover bg-center flex items-end">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2c38] to-transparent opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-blue-600/20 mix-blend-overlay" />
                    </div>
                    <div className="p-4 flex justify-between items-center bg-[#1a2c38]">
                        <div className="flex items-center gap-3 font-bold text-lg">
                            <Dna size={20} className="text-[var(--text-secondary)]" /> Sports
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#00e701]">
                            <span className="w-2 h-2 rounded-full bg-[#00e701] animate-pulse"></span>
                            16,422
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
