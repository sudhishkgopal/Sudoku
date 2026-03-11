import { useState, useEffect, useCallback } from "react";
import { SudokuEngine } from "./engine/SudokuEngine";
import type { SudokuGrid, SudokuGraph } from "./engine/SudokuEngine";
import { DIFFICULTY, GRID_SIZE, EMPTY_CELL, DIGITS } from "./engine/constants";
import SudokuGridComponent from "./components/SudokuGrid";
import NumPad from "./components/NumPad";
import Controls from "./components/Controls";
import GraphView from "./components/GraphView";

const engine = new SudokuEngine();
type Difficulty = keyof typeof DIFFICULTY;

export default function App() {
  const [puzzle, setPuzzle] = useState<SudokuGrid>([]);
  const [solution, setSolution] = useState<SudokuGrid>([]);
  const [userGrid, setUserGrid] = useState<SudokuGrid>([]);
  const [graph, setGraph] = useState<SudokuGraph | null>(null);
  const [notes, setNotes] = useState<Set<number>[][][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null,);  
  const [notesMode, setNotesMode] = useState(false);
  const [history, setHistory] = useState<SudokuGrid[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [elapsed, setElapsed] = useState(0);
  

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
    setElapsed(0);
  }, []);

  useEffect(() => {
    startNewGame("MEDIUM");
  }, []);

  useEffect(() => {
  if (isComplete) return;
  const id = setInterval(() => setElapsed(s => s + 1), 1000);
  return () => clearInterval(id);
}, [isComplete]);

  const handleCellSelect = (row: number, col: number) => {
    if (puzzle[row]?.[col] !== EMPTY_CELL) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell;
    if (puzzle[row][col] !== EMPTY_CELL) return; //prevent input on given cells

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); //prevent arrow keys from scrolling the page
        setSelectedCell((prev) => {
          if (!prev) return [0, 0] as [number, number];
          const [r, c] = prev;
          if (e.key == "ArrowUp") return [Math.max(0, r - 1), c];
          else if (e.key == "ArrowDown")
            return [Math.min(GRID_SIZE - 1, r + 1), c];
          else if (e.key == "ArrowLeft") return [r, Math.max(0, c - 1)];
          else {
            return [r, Math.min(GRID_SIZE - 1, c + 1)];
          }
        });
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) handleNumberInput(num);
      if (e.key === "Backspace" || e.key === "Delete") handleErase();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNumberInput, handleErase]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-6 px-4">
      <h1 className="text-2xl font-bold tracking-wide mb-4">Graph Sudoku</h1>

      {/* DEV ONLY — remove before release */}
      <button
        onClick={() => { setUserGrid(solution.map(r => [...r])); setIsComplete(true); }}
        className="mb-2 px-3 py-1 bg-red-800 text-xs rounded text-white"
      >
        [DEV] Complete
      </button>
      {/* END OF DEV*/}

      <p className="text-gray-400 text-sm mb-4 font-mono">
        {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
      </p>

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

      {showGraph && graph && (
        <div className="mt-4">
          <GraphView graph={graph} solution={solution} />
        </div>
      )}
    </div>
  );
}
