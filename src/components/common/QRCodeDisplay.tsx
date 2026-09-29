import React from 'react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  label,
  sublabel,
}) => {
  // Generate deterministic binary matrix from string hash
  const gridSize = 25;
  const matrix: boolean[][] = React.useMemo(() => {
    // Generate pseudo-random deterministic grid
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    const grid: boolean[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false)
    );

    // Seeded generator
    let seed = Math.abs(hash) || 123456789;
    const nextRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Fill data area
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Reserve corners for finder patterns (7x7 in top-left, top-right, bottom-left)
        const isTopLeftFinder = r < 7 && c < 7;
        const isTopRightFinder = r < 7 && c >= gridSize - 7;
        const isBottomLeftFinder = r >= gridSize - 7 && c < 7;
        const isAlignment = r >= gridSize - 9 && r <= gridSize - 5 && c >= gridSize - 9 && c <= gridSize - 5;

        if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder || isAlignment) {
          continue;
        }

        // Timing patterns
        if (r === 6 || c === 6) {
          grid[r][c] = (r + c) % 2 === 0;
          continue;
        }

        grid[r][c] = nextRandom() > 0.48;
      }
    }

    // Helper for 7x7 finder pattern
    const applyFinder = (startR: number, startC: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerSolid = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[startR + r][startC + c] = isOuterBorder || isInnerSolid;
        }
      }
    };

    applyFinder(0, 0);
    applyFinder(0, gridSize - 7);
    applyFinder(gridSize - 7, 0);

    return grid;
  }, [value]);

  const cellSize = 100 / gridSize;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="p-3 bg-white rounded-xl shadow-sm border border-neutral-200 transition-all hover:shadow-md"
        style={{ width: size + 24, height: size + 24 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          shapeRendering="crispEdges"
        >
          {matrix.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize + 0.05}
                  height={cellSize + 0.05}
                  fill="#064E3B"
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {label && (
        <span className="mt-2 text-xs font-mono font-semibold tracking-wider text-emerald-950 uppercase">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] text-neutral-500 font-medium">
          {sublabel}
        </span>
      )}
    </div>
  );
};
