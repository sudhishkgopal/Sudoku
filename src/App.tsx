import { useState, useEffect, useCallback } from "react";
import { SudokuEngine } from "./engine/SudokuEngine";
import type { SudokuGrid, SudokuGraph } from "./engine/SudokuEngine";
import { DIFFICULTY, GRID_SIZE, EMPTY_CELL, DIGITS } from "./engine/constants";
import SudokuGridComponent from "./components/SudokuGrid";
import NumPad from "./components/NumPad";
import Controls from "./components/Controls";

const engine = new SudokuEngine();
type Difficulty = keyof typeof DIFFICULTY;

export default function App() {
  const [puzzle, setPuzzle] = useState<SudokuGrid>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [userGrid, setUserGrid] = useState<SudokuGrid>([]);
  const [_graph, setGraph] = useState<SudokuGraph | null>(null);
  const [notes, setNotes] = useState<Set<number>[][][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [notesMode, setNotesMode] = useState(false);
  const [history, setHistory] = useState<SudokuGrid[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");

  const startNewGame = useCallback((diff: Difficulty) => {
    const result = engine.generatePuzzle(DIFFICULTY[diff].clues);
    setPuzzle(result.puzzle);
    setSolution(result.solution);
    setGraph(result.graph);
    setUserGrid(result.puzzle.map((row) => [...row]));
    setNotes(
      Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => new Set<number>()),
      ),
    );
    setSelectedCell(null);
    setHistory([]);
    setIsComplete(false);
    setShowGraph(false);
    setNotesMode(false);
  }, []);

  useEffect(() => {
    startNewGame("MEDIUM");
  }, []);

  const handleCellSelect = (row: number, col: number) => {
    if (puzzle[row]?.[col] !== EMPTY_CELL) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;

    if (notesMode) {
      const newNotes = notes.map((r) => r.map((c) => new Set(c)));
      newNotes[row][col].has(num)
        ? newNotes[row][col].delete(num)
        : newNotes[row][col].add(num);
      setNotes(newNotes);
      return;
    }

    setHistory((prev) => [...prev, userGrid.map((r) => [...r])]);
    const newGrid = userGrid.map((r) => [...r]);
    newGrid[row][col] = num;
    setUserGrid(newGrid);

    const complete = newGrid.every((r, ri) =>
      r.every((cell, ci) => cell === solution[ri][ci]),
    );
    if (complete) setIsComplete(true);
  };

  const handleErase = () => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    setHistory((prev) => [...prev, userGrid.map((r) => [...r])]);
    const newGrid = userGrid.map((r) => [...r]);
    newGrid[row][col] = EMPTY_CELL;
    setUserGrid(newGrid);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setUserGrid(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  const remaining = DIGITS.map(
    (n) => GRID_SIZE - userGrid.flat().filter((cell) => cell === n).length,
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-6 px-4">
      <h1 className="text-2xl font-bold tracking-wide mb-4">Graph Sudoku</h1>

      <div className="flex gap-2 mb-4">
        {(Object.keys(DIFFICULTY) as Difficulty[]).map((diff) => (
          <button
            key={diff}
            onClick={() => {
              setDifficulty(diff);
              startNewGame(diff);
            }}
            className={`px-3 py-1 rounded text-sm font-medium touch-manipulation ${
              difficulty === diff ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {DIFFICULTY[diff].label}
          </button>
        ))}
      </div>

      <SudokuGridComponent
        puzzle={puzzle}
        userGrid={userGrid}
        notes={notes}
        solution={solution}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />

      <Controls
        notesMode={notesMode}
        onNotesToggle={() => setNotesMode((m) => !m)}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        isComplete={isComplete}
        showGraph={showGraph}
        onShowGraphToggle={() => setShowGraph((g) => !g)}
      />

      <NumPad
        onNumber={handleNumberInput}
        onErase={handleErase}
        remaining={remaining}
      />

      {isComplete && (
        <p className="mt-4 text-green-400 font-semibold text-lg animate-pulse">
          Puzzle Complete!
        </p>
      )}
    </div>
  );
}
