import React from 'react';
import {
    Cat, Dog, Fish, Rabbit, Bird, Bug, Rat,
    Squirrel, Turtle, Snail, Skull, Loader2
} from 'lucide-react';
import type { Card as CardType } from '../../hooks/useMemoryGame';

const ICONS = [
    Cat, Dog, Fish, Rabbit, Bird, Bug,
    Rat, Squirrel, Turtle, Snail, Skull
];

interface CardProps {
    card: CardType;
    onClick: () => void;
    disabled: boolean;
    isSelected: boolean;
    isLoading?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isSelected, isLoading }) => {
    const isVisible = card.state !== 'HIDDEN' || isSelected;
    const isRemoved = card.state === 'REMOVED';
    const Icon = ICONS[card.imageId % ICONS.length];

    if (isRemoved) {
        return <div className="w-20 h-28 m-2 invisible" />;
    }

    return (
        <div
            className={`
                w-20 h-28 m-2 cursor-pointer perspective-1000
                ${(disabled || isLoading) && !isVisible ? 'cursor-not-allowed opacity-80' : ''}
            `}
            onClick={() => !disabled && !isLoading && !isVisible && onClick()}
        >
            <div className={`
                relative w-full h-full transition-transform duration-500 transform-style-3d
                ${isVisible ? 'rotate-y-180' : ''}
            `}
                style={{ transformStyle: 'preserve-3d', transform: isVisible ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* Back of Card (Hidden) */}
                <div
                    className="absolute w-full h-full bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {isLoading && isSelected ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <div className="w-12 h-16 border-2 border-indigo-400 rounded opacity-30" />
                    )}
                </div>

                {/* Front of Card (Revealed) */}
                <div
                    className="absolute w-full h-full bg-white rounded-lg shadow-lg flex items-center justify-center backface-hidden rotate-y-180"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <Icon className="w-10 h-10 text-indigo-600" />
                </div>
            </div>
        </div>
    );
};
