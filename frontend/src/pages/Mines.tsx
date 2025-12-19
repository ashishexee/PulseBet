import { useState } from 'react';

export const Mines = () => {
    const [betAmount, setBetAmount] = useState('0.00000000');
    const [minesCount, setMinesCount] = useState(3);

    const grid = Array.from({ length: 25 }, (_, i) => i);

    return (
        <div className="bg-[#0f212e] rounded-md p-4 md:p-8 max-w-[1000px] mx-auto mt-8 shadow-2xl min-h-[600px] flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-[300px] bg-[#213743] rounded-sm p-4 flex flex-col gap-6 h-fit">

                <div className="bg-[#0f212e] p-1 rounded-full flex">
                    <button className="flex-1 py-2 rounded-full text-xs font-bold bg-[#2f4553] text-white shadow">Manual</button>
                    <button className="flex-1 py-2 rounded-full text-xs font-bold text-[#b1b1b1] hover:text-white transition-colors">Auto</button>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-semibold text-[#b1b1b1] mb-1">
                        <span>Bet Amount</span>
                        <span>$0.00</span>
                    </div>
                    <div className="bg-[#0f212e] rounded-sm border border-[#2f4553] hover:border-[#557086] flex overflow-hidden transition-colors">
                        <input
                            type="text"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="bg-transparent text-white font-bold p-2.5 text-sm w-full outline-none"
                        />
                        <div className="flex items-center gap-1 pr-2">
                            <span className="text-yellow-500 font-bold text-lg">₿</span>
                        </div>
                        <div className="flex border-l border-[#2f4553]">
                            <button className="px-3 hover:bg-[#2f4553] text-[#b1b1b1] font-semibold text-xs transition-colors">½</button>
                            <button className="px-3 hover:bg-[#2f4553] text-[#b1b1b1] font-semibold text-xs transition-colors border-l border-[#2f4553]">2×</button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-[#b1b1b1] mb-1 block">Mines</label>
                    <div className="relative">
                        <select
                            value={minesCount}
                            onChange={(e) => setMinesCount(Number(e.target.value))}
                            className="w-full bg-[#0f212e] text-white font-bold p-2.5 rounded-sm border border-[#2f4553] outline-none appearance-none hover:border-[#557086] transition-colors cursor-pointer"
                        >
                            {[1, 3, 5, 10, 24].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#b1b1b1] text-xs">▼</div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-[#b1b1b1] mb-1 block">Gems</label>
                    <input
                        readOnly
                        value={25 - minesCount}
                        className="w-full bg-[#2f4553] text-[#b1b1b1] font-bold p-2.5 rounded-sm border border-transparent outline-none cursor-not-allowed opacity-70"
                    />
                </div>

                <button className="bg-[#00e701] hover:bg-[#00c701] text-[#014201] font-bold py-3.5 rounded-sm shadow-[0_4px_0_0_#00a701] transition-transform active:translate-y-1 active:shadow-none translate-y-0">
                    Bet
                </button>
                <div className="text-center text-xs text-[#b1b1b1]">
                    <span className="opacity-0">.</span> {/* Spacer */}
                </div>
                <button className="bg-[#2f4553] hover:bg-[#3f5866] text-white font-semibold py-3 rounded-sm transition-colors">
                    Random Pick
                </button>

            </div>

            <div className="flex-1 bg-[#0f212e] flex flex-col relative rounded-r-md">
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="grid grid-cols-5 gap-3 w-full max-w-[500px] aspect-square">
                        {grid.map((i) => (
                            <button
                                key={i}
                                className="bg-[#2f4553] rounded-sm hover:bg-[#557086] transition-all transform hover:-translate-y-1 shadow-[0_4px_0_0_#1a2c38] active:translate-y-0 active:shadow-none h-full w-full"
                            >
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-10 border-t border-[#213743] flex items-center justify-between px-4 text-[#b1b1b1] text-sm">
                </div>
            </div>
        </div>
    );
};
