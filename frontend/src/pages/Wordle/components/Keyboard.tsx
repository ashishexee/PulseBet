import React, { useMemo } from 'react';

interface KeyboardProps {
    onChar: (char: string) => void;
    onDelete: () => void;
    onEnter: () => void;
    guesses: string[];
    feedbackHistory: number[][];
}

export const Keyboard: React.FC<KeyboardProps> = ({ onChar, onDelete, onEnter, guesses, feedbackHistory }) => {

    const keyStatus = useMemo(() => {
        const status: Record<string, number> = {};

        guesses.forEach((guess, guessIndex) => {
            const feedback = feedbackHistory[guessIndex];
            if (!feedback) return;

            guess.split('').forEach((char, charIndex) => {
                const upperChar = char.toUpperCase();
                const currentStatus = status[upperChar];
                const newStatus = feedback[charIndex];

                if (currentStatus === 2) return;
                if (newStatus === 2) {
                    status[upperChar] = 2;
                    return;
                }
                if (currentStatus === 1) return; 
                if (newStatus === 1) {
                    status[upperChar] = 1;
                    return;
                }
                if (currentStatus === undefined) {
                    status[upperChar] = 0;
                }
            });
        });
        return status;
    }, [guesses, feedbackHistory]);

    const keys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ];

    return (
        <div className="w-full max-w-2xl px-2">
            {keys.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5 mb-2">
                    {row.map((key) => {
                        const isSpecial = key.length > 1;
                        const status = keyStatus[key] ?? -1;

                        let bgClass = "bg-zinc-800/40 border border-white/5 hover:bg-white/10 text-zinc-300 backdrop-blur-sm";
                        if (status === 2) bgClass = "bg-green-500 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:bg-green-400";
                        else if (status === 1) bgClass = "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:bg-yellow-400";
                        else if (status === 0) bgClass = "bg-black/40 border-zinc-800 text-zinc-600"; // Used and wrong

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === 'ENTER') onEnter();
                                    else if (key === 'BACK') onDelete();
                                    else onChar(key);
                                }}
                                className={`
                                    ${isSpecial ? 'px-4 text-[10px] tracking-wider font-black' : 'flex-1 max-w-[45px] font-bold text-lg'}
                                    h-14 rounded-lg flex items-center justify-center 
                                    transition-all duration-200 select-none active:scale-95
                                    ${bgClass}
                                `}
                            >
                                {key === 'BACK' ? '⌫' : key}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
