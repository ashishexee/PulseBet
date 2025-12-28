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
            className="relative w-full aspect-square cursor-pointer"
            onClick={!disabled && !isMatched ? onClick : undefined}
            whileHover={!disabled && !isMatched ? { scale: 1.02 } : {}}
            whileTap={!disabled && !isMatched ? { scale: 0.98 } : {}}
        >
            <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: showFront ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Back side - Minimalist Tech */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg group"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
                        <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
                    </div>
                    {/* Corner accents */}
                    <div className="absolute top-2 left-2 w-1 h-1 bg-zinc-800"></div>
                    <div className="absolute top-2 right-2 w-1 h-1 bg-zinc-800"></div>
                    <div className="absolute bottom-2 left-2 w-1 h-1 bg-zinc-800"></div>
                    <div className="absolute bottom-2 right-2 w-1 h-1 bg-zinc-800"></div>
                </div>

                {/* Front side - Clean Display */}
                <div
                    className={`absolute w-full h-full backface-hidden rounded-xl flex items-center justify-center border shadow-xl ${isMatched
                        ? 'bg-zinc-200 border-zinc-200'
                        : isFirst
                            ? 'bg-zinc-800 border-zinc-600'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className={`text-4xl ${isMatched ? 'grayscale-0' : 'grayscale text-white'}`}>
                        {imageId !== null && CARD_IMAGES[imageId]}
                    </div>

                    {isMatched && (
                        <div className="absolute inset-0 border-2 border-zinc-900 rounded-xl opacity-10"></div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
