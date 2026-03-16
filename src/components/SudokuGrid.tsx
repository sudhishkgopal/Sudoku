import { GRID_SIZE, BOX_SIZE, DIGITS, EMPTY_CELL } from "../engine/constants";
import type { SudokuGrid, Cage } from "../engine/SudokuEngine";

interface Props {
  puzzle: SudokuGrid;
  userGrid: SudokuGrid;
  notes: number[][][];
  solution: SudokuGrid;
  selectedCell: [number, number] | null;
  onCellSelect: (row: number, col: number) => void;
  killerMode?: boolean;
  cages?: Cage[];
}

function hasConflict(grid: SudokuGrid, row: number, col: number): boolean {
  const val = grid[row][col];
  if (val === EMPTY_CELL) return false;
  for (let c = 0; c < GRID_SIZE; c++)
    if (c !== col && grid[row][c] === val) return true;
  for (let r = 0; r < GRID_SIZE; r++)
    if (r !== row && grid[r][col] === val) return true;
  const br = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const bc = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = br; r < br + BOX_SIZE; r++)
    for (let c = bc; c < bc + BOX_SIZE; c++)
      if ((r !== row || c !== col) && grid[r][c] === val) return true;
  return false;
}

function CageOverlay({
  cages,
  userGrid,
}: {
  cages: Cage[];
  userGrid: SudokuGrid;
}) {
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      viewBox="0 0 9 9"
    >
      {cages.map((cage) => {
        const cageSet = new Set(
          cage.cells.map((c) => c.row * GRID_SIZE + c.col),
        );
        const currentSum = cage.cells.reduce(
          (acc, c) => acc + userGrid[c.row][c.col],
          0,
        );
        const filled = cage.cells.every(
          (c) => userGrid[c.row][c.col] !== EMPTY_CELL,
        );
        const exceeded = currentSum > cage.sum;
        const correct = filled && currentSum === cage.sum;
        const color = correct ? "#4ade80" : exceeded ? "#f87171" : "#f59e0b";

        const segments: { x1: number; y1: number; x2: number; y2: number }[] =
          [];
        cage.cells.forEach(({ row, col }) => {
          if (row === 0 || !cageSet.has((row - 1) * GRID_SIZE + col))
            segments.push({ x1: col, y1: row, x2: col + 1, y2: row });
          if (
            row === GRID_SIZE - 1 ||
            !cageSet.has((row + 1) * GRID_SIZE + col)
          )
            segments.push({ x1: col, y1: row + 1, x2: col + 1, y2: row + 1 });
          if (col === 0 || !cageSet.has(row * GRID_SIZE + (col - 1)))
            segments.push({ x1: col, y1: row, x2: col, y2: row + 1 });
          if (
            col === GRID_SIZE - 1 ||
            !cageSet.has(row * GRID_SIZE + (col + 1))
          )
            segments.push({ x1: col + 1, y1: row, x2: col + 1, y2: row + 1 });
        });

        const labelCell = cage.cells.reduce((best, cell) =>
          cell.row < best.row || (cell.row === best.row && cell.col < best.col)
            ? cell
            : best,
        );

        return (
          <g key={cage.id}>
            {segments.map((seg, i) => (
              <line
                key={i}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={color}
                strokeWidth={0.07}
                strokeDasharray="0.18 0.1"
              />
            ))}
            <text
              x={labelCell.col + 0.08}
              y={labelCell.row + 0.3}
              fontSize={0.28}
              fill={color}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {cage.sum}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function SudokuGridComponent({
  puzzle,
  userGrid,
  notes,
  selectedCell,
  onCellSelect,
  killerMode,
  cages,
}: Props) {
  if (!puzzle.length) return null;

  return (
    <div style={{ position: "relative", width: "min(95vw, 450px)" }}>
      <div
        className="grid border-2 border-gray-400"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {userGrid.map((row, ri) =>
          row.map((cell, ci) => {
            const isGiven = puzzle[ri][ci] !== EMPTY_CELL;
            const isSelected =
              selectedCell?.[0] === ri && selectedCell?.[1] === ci;
            const conflict = !isGiven && hasConflict(userGrid, ri, ci);
            const sameBox =
              selectedCell &&
              Math.floor(selectedCell[0] / BOX_SIZE) ===
                Math.floor(ri / BOX_SIZE) &&
              Math.floor(selectedCell[1] / BOX_SIZE) ===
                Math.floor(ci / BOX_SIZE);
            const sameRowCol =
              selectedCell &&
              (selectedCell[0] === ri || selectedCell[1] === ci);

            let bg = "bg-gray-900";
            if (sameRowCol || sameBox) bg = "bg-gray-800";
            if (isSelected) bg = "bg-blue-900";

            const borderR =
              (ci + 1) % BOX_SIZE === 0 && ci < GRID_SIZE - 1
                ? "border-r-2 border-r-gray-400"
                : "border-r border-r-gray-700";
            const borderB =
              (ri + 1) % BOX_SIZE === 0 && ri < GRID_SIZE - 1
                ? "border-b-2 border-b-gray-400"
                : "border-b border-b-gray-700";

            const cellNotes = notes[ri]?.[ci];

            return (
              <div
                key={`${ri}-${ci}`}
                onClick={() => onCellSelect(ri, ci)}
                className={`aspect-square flex items-center justify-center cursor-pointer select-none ${bg} ${borderR} ${borderB}`}
              >
                {cell !== EMPTY_CELL ? (
                  <span
                    className={`text-lg font-semibold ${
                      isGiven
                        ? "text-gray-200"
                        : conflict
                          ? "text-red-400"
                          : "text-blue-400"
                    }`}
                  >
                    {cell}
                  </span>
                ) : cellNotes && cellNotes.length > 0 ? (
                  <div className="grid grid-cols-3 w-full h-full p-px">
                    {DIGITS.map((n) => (
                      <span
                        key={n}
                        className="flex items-center justify-center text-gray-500"
                        style={{ fontSize: "0.45rem" }}
                      >
                        {cellNotes.includes(n) ? n : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
      {killerMode && cages && cages.length > 0 && (
        <CageOverlay cages={cages} userGrid={userGrid} />
      )}
    </div>
  );
}
