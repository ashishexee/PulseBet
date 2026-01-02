import React from 'react';

interface GridProps {
    guesses: string[];
    currentGuess: string;
    feedbackHistory: number[][]; // 0=Grey, 1=Yellow, 2=Green
    attempts: number;
}

export const Grid: React.FC<GridProps> = ({ guesses, currentGuess, feedbackHistory, attempts }) => {
    // We always show 5 rows for this version
    const rows = Array.from({ length: 5 }, (_, i) => i);

    return (
        <div className="grid grid-rows-5 gap-2 mb-8">
            {rows.map((rowIndex) => {
                if (rowIndex < attempts) {
                    // Completed row
                    return <Row key={rowIndex} word={guesses[rowIndex]} feedback={feedbackHistory[rowIndex]} />
                } else if (rowIndex === attempts) {
                    // Current guessing row
                    return <Row key={rowIndex} word={currentGuess} current />
                } else {
                    // Empty row
                    return <Row key={rowIndex} word="" />
                }
            })}
        </div>
    );
};

interface RowProps {
    word: string;
    feedback?: number[];
    current?: boolean;
}

const Row: React.FC<RowProps> = ({ word, feedback, current }) => {
    const tiles = Array.from({ length: 5 }, (_, i) => i);
    const splitWord = word.padEnd(5, ' ').split('');

    return (
        <div className="grid grid-cols-5 gap-2 md:gap-3">
            {tiles.map((i) => {
                const char = splitWord[i];
                let bgClass = "bg-white/5 border-white/5 text-transparent";
                let textClass = "";

                if (feedback) {
                    const status = feedback[i];
                    if (status === 2) { // Green
                        bgClass = "bg-green-500 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.4)]";
                        textClass = "text-black";
                    }
                    else if (status === 1) { // Yellow
                        bgClass = "bg-yellow-500 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.4)]";
                        textClass = "text-black";
                    }
                    else if (status === 0) { // Grey
                        bgClass = "bg-zinc-800/50 border-zinc-700/50";
                        textClass = "text-zinc-500";
                    }
                } else if (char !== ' ') {
                    // Filled but not submitted
                    bgClass = "bg-zinc-900 border-zinc-600 shadow-inner";
                    textClass = "text-white animate-in zoom-in-95 duration-200";
                }

                return (
                    <div key={i} className={`
                        w-12 h-12 sm:w-16 sm:h-16 
                        flex items-center justify-center 
                        text-2xl sm:text-3xl font-black uppercase tracking-wider
                        border-2 ${bgClass} ${textClass}
                        rounded-xl select-none transition-all duration-300
                        ${current && char !== ' ' ? 'animate-bounce-short border-white/40' : ''}
                        ${!feedback && char === ' ' ? 'group-hover:border-white/10' : ''}
                    `}>
                        {char !== ' ' ? char : ''}
                    </div>
                );
            })}
        </div>
    );
};
