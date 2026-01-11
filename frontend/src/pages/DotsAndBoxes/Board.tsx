import React from 'react';

interface BoardProps {
    gridSize: number; // e.g. 8 for 8x8 dots
    horizontalLines: Set<string>; // Format: "r,c" where line is from (r,c) to (r,c+1)
    verticalLines: Set<string>;   // Format: "r,c" where line is from (r,c) to (r+1,c)
    squares: Map<string, string>; // Format: "r,c" -> ownerId (color/address)
    onLineClick: (orientation: 'h' | 'v', r: number, c: number) => void;
    currentTurnColor: string;
    interactive: boolean;
}

export const Board: React.FC<BoardProps> = ({
    gridSize,
    horizontalLines,
    verticalLines,
    squares,
    onLineClick,
    interactive
}) => {
    // Generate grid coordinates
    const rows = Array.from({ length: gridSize }, (_, i) => i);
    const cols = Array.from({ length: gridSize }, (_, i) => i);

    const GAP = 50; // Pixel gap between dots
    const DOT_RADIUS = 6;
    const PADDING = 40;

    // Helper to get square color
    const getSquareColor = (r: number, c: number) => {
        const key = `${r},${c}`;
        return squares.get(key);
    };

    // Helper to check if line is drawn
    const isHorizontalDrawn = (r: number, c: number) => horizontalLines.has(`${r},${c}`);
    const isVerticalDrawn = (r: number, c: number) => verticalLines.has(`${r},${c}`);

    return (
        <div className="flex items-center justify-center p-8 bg-black/20 rounded-3xl border border-zinc-800">
            <svg
                width={gridSize * GAP + PADDING * 2}
                height={gridSize * GAP + PADDING * 2}
                className="select-none"
            >
                <g transform={`translate(${PADDING}, ${PADDING})`}>
                    {/* Render Squares (Backgrounds) first */}
                    {Array.from({ length: gridSize - 1 }).map((_, r) =>
                        Array.from({ length: gridSize - 1 }).map((_, c) => {
                            const ownerColor = getSquareColor(r, c);
                            if (!ownerColor) return null;
                            return (
                                <rect
                                    key={`sq-${r}-${c}`}
                                    x={c * GAP}
                                    y={r * GAP}
                                    width={GAP}
                                    height={GAP}
                                    fill={ownerColor}
                                    className="opacity-50 transition-opacity duration-500"
                                />
                            );
                        })
                    )}

                    {/* Horizontal Lines */}
                    {rows.map((r) =>
                        Array.from({ length: gridSize - 1 }).map((_, c) => {
                            const isDrawn = isHorizontalDrawn(r, c);
                            return (
                                <rect
                                    key={`h-${r}-${c}`}
                                    x={c * GAP + DOT_RADIUS}
                                    y={r * GAP - 4}
                                    width={GAP - DOT_RADIUS * 2}
                                    height={8}
                                    fill={isDrawn ? 'white' : 'transparent'}
                                    className={`
                                        transition-all duration-200
                                        ${!isDrawn && interactive ? 'cursor-pointer hover:fill-zinc-600/50' : ''}
                                        ${isDrawn ? 'shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}
                                    `}
                                    onClick={() => !isDrawn && interactive && onLineClick('h', r, c)}
                                />
                            );
                        })
                    )}

                    {/* Vertical Lines */}
                    {Array.from({ length: gridSize - 1 }).map((_, r) =>
                        cols.map((c) => {
                            const isDrawn = isVerticalDrawn(r, c);
                            return (
                                <rect
                                    key={`v-${r}-${c}`}
                                    x={c * GAP - 4}
                                    y={r * GAP + DOT_RADIUS}
                                    width={8}
                                    height={GAP - DOT_RADIUS * 2}
                                    fill={isDrawn ? 'white' : 'transparent'}
                                    className={`
                                        transition-all duration-200
                                        ${!isDrawn && interactive ? 'cursor-pointer hover:fill-zinc-600/50' : ''}
                                        ${isDrawn ? 'shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}
                                    `}
                                    onClick={() => !isDrawn && interactive && onLineClick('v', r, c)}
                                />
                            );
                        })
                    )}

                    {/* Dots */}
                    {rows.map(r =>
                        cols.map(c => (
                            <circle
                                key={`d-${r}-${c}`}
                                cx={c * GAP}
                                cy={r * GAP}
                                r={DOT_RADIUS}
                                className="fill-zinc-400"
                            />
                        ))
                    )}
                </g>
            </svg>
        </div>
    );
};
