import { motion } from 'framer-motion';

interface CardProps {
    position: number;
    imageId: number | null;
    isRevealed: boolean;
    isMatched: boolean;
    isFirst: boolean;
    onClick: () => void;
    disabled: boolean;
}

const CARD_IMAGES = [
    '🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🎺'
];

export const Card = ({
    imageId,
    isRevealed,
    isMatched,
    isFirst,
    onClick,
    disabled
}: CardProps) => {
    const showFront = isRevealed || isMatched;

    return (
        <motion.div
            className="relative w-full aspect-square cursor-pointer perspective-1000"
            onClick={!disabled && !isMatched ? onClick : undefined}
            whileHover={!disabled && !isMatched ? { scale: 1.02 } : {}}
            whileTap={!disabled && !isMatched ? { scale: 0.98 } : {}}
        >
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: showFront ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Back side - Tech Grid */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg group overflow-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(-45deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                    <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center relative z-10 bg-black/50 backdrop-blur-sm group-hover:border-zinc-700 transition-colors">
                        <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full group-hover:bg-zinc-400 group-hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all"></div>
                    </div>
                </div>

                {/* Front side - Content */}
                <div
                    className={`absolute w-full h-full backface-hidden rounded-2xl flex items-center justify-center border shadow-xl overflow-hidden ${isMatched
                        ? 'bg-white border-white'
                        : isFirst
                            ? 'bg-zinc-900 border-zinc-700'
                            : 'bg-zinc-950 border-zinc-700'
                        }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    {isMatched && (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-300"></div>
                    )}

                    <div className={`relative z-10 text-5xl transform transition-transform ${isMatched ? 'scale-110 grayscale-0' : 'grayscale text-white'}`}>
                        {imageId !== null && CARD_IMAGES[imageId]}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
