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
    // position,  // Not used currently
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
            whileHover={!disabled && !isMatched ? { scale: 1.05 } : {}}
            whileTap={!disabled && !isMatched ? { scale: 0.95 } : {}}
        >
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: showFront ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Back side - Tactical Button Look */}
                <div
                    className="absolute w-full h-full backface-hidden rounded-lg bg-gradient-to-b from-[#3a5b74] to-[#2f4553] flex items-center justify-center border border-[#2f4553] shadow-[0_5px_0_#1a2c38]"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="text-2xl opacity-20">❖</div>
                </div>

                {/* Front side - Recessed Screen Look */}
                <div
                    className={`absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center border-2 shadow-inner ${isMatched
                        ? 'bg-[#071824] border-[#00e701] shadow-[0_0_15px_rgba(0,231,1,0.2)]'
                        : isFirst
                            ? 'bg-[#071824] border-[var(--primary-blue)] shadow-[0_0_15px_rgba(20,117,225,0.2)]'
                            : 'bg-[#071824] border-[#2f4553]/50'
                        }`}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="text-5xl drop-shadow-md">
                        {imageId !== null && CARD_IMAGES[imageId]}
                    </div>
                </div>
            </motion.div>

            {isFirst && (
                <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                >
                    1
                </motion.div>
            )}
        </motion.div>
    );
};
