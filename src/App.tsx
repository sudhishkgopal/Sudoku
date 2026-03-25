import { useEffect, useState, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import type { Difficulty } from './store/gameStore';
import { DIFFICULTY, GRID_SIZE, DIGITS } from './engine/constants';
import SudokuGridComponent from './components/SudokuGrid';
import NumPad from './components/NumPad';
import Controls from './components/Controls';
import GraphView from './components/GraphView';
import UpdateToast from './components/UpdateToast';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [visitCount, setVisitCount] = useState<number | string>('...');
  const hasCounted = useRef(false);

  useEffect(() => {
    if (hasCounted.current) return;
    hasCounted.current = true;

    // Load local first for quick display
    const localVisits = localStorage.getItem('sudoku_visits');
    if (localVisits) setVisitCount(parseInt(localVisits, 10));

    fetch('https://api.counterapi.dev/v1/graphsudoku/visits/up')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.count) {
          setVisitCount(data.count);
          localStorage.setItem('sudoku_visits', data.count.toString());
        }
      })
      .catch((err) => {
        console.error('Counter API error:', err);
        // Fallback to local counter
        const visits = parseInt(localVisits || '0', 10);
        const newVisits = visits + 1;
        setVisitCount(newVisits);
        localStorage.setItem('sudoku_visits', newVisits.toString());
      });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const {
    puzzle, solution, graph, userGrid, notes,
    selectedCell, notesMode, history, isComplete, showGraph, difficulty, elapsed,
    killerMode, cages, mistakes, isLost,
    startNewGame, selectCell, inputNumber, erase, undo,
    toggleNotes, toggleGraph, toggleKillerMode, tick, moveSelection,
  } = useGameStore();

  // Generate a new game only on first launch (no persisted state)
  useEffect(() => {
    if (puzzle.length === 0) startNewGame('MEDIUM');
  }, []);

  // Timer — increments elapsed every second until puzzle is complete
  useEffect(() => {
    if (isComplete || isLost) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isComplete, isLost, tick]);

  // Keyboard — arrow navigation + digit/erase input
  useEffect(() => {
    const arrowMap: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0],
      ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key in arrowMap) {
        e.preventDefault();
        const [dr, dc] = arrowMap[e.key];
        moveSelection(dr, dc);
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) inputNumber(num);
      if (e.key === 'Backspace' || e.key === 'Delete') erase();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveSelection, inputNumber, erase]);

  const remaining = DIGITS.map(
    (n) => GRID_SIZE - userGrid.flat().filter((cell: number) => cell === n).length,
  );

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#f8f5ee] dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 flex flex-col items-center pt-14 pb-6 px-4 relative">
      <div className="absolute top-4 right-4 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-300">
        Visits: {visitCount}
      </div>
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-2 left-4 p-2 rounded-full transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
        aria-label="Toggle Theme"
        title="Toggle Light/Dark Mode"
      >
        {isDarkMode ? '🌙' : '☀️'}
      </button>

      <UpdateToast />

      <h1 className="text-2xl font-bold tracking-wide mb-4">Graph Sudoku</h1>

      {/* DEV ONLY — remove before release */}
      {/* <button
        onClick={() => useGameStore.setState({ userGrid: solution.map((r: number[]) => [...r]), isComplete: true })}
        className="mb-2 px-3 py-1 bg-red-800 text-xs rounded text-white"
      >
        [DEV] Complete
      </button> */}

      <p className="text-gray-400 text-sm mb-4 font-mono">{mm}:{ss}</p>

      {killerMode && (
        <div className="flex gap-1 mb-4">
          {[...Array(3)].map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={i < 3 - mistakes ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-6 h-6 transition-all duration-300 ${
                i < 3 - mistakes
                  ? "text-red-500 scale-100 drop-shadow-sm"
                  : "text-gray-300 dark:text-gray-700 scale-90"
              }`}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        {(Object.keys(DIFFICULTY) as Difficulty[]).map((diff) => (
          <button
            key={diff}
            onClick={() => startNewGame(diff)}
            className={`px-3 py-1 rounded text-sm font-medium touch-manipulation text-[#f8f5ee] dark:text-white ${
              difficulty === diff ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {DIFFICULTY[diff].label}
          </button>
        ))}
        <button
          onClick={toggleKillerMode}
          className={`px-3 py-1 rounded text-sm font-medium touch-manipulation text-[#f8f5ee] dark:text-white ${
            killerMode ? 'bg-orange-600' : 'bg-gray-700'
          }`}
        >
          Killer {killerMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="relative">
        <SudokuGridComponent
          puzzle={puzzle}
          userGrid={userGrid}
          notes={notes}
          solution={solution}
          killerMode={killerMode}
          cages={cages}
          selectedCell={selectedCell}
          onCellSelect={selectCell}
        />
        {(isComplete || isLost) && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-fade-in">
            {isComplete && (
              <p className="text-green-600 dark:text-green-400 font-bold text-3xl animate-bounce drop-shadow-md">
                Puzzle Complete!
              </p>
            )}
            {isLost && (
              <p className="text-red-600 dark:text-red-500 font-bold text-3xl animate-pulse drop-shadow-md">
                Game Over!
              </p>
            )}
          </div>
        )}
      </div>

      <Controls
        notesMode={notesMode}
        onNotesToggle={toggleNotes}
        onUndo={undo}
        canUndo={history.length > 0}
        isComplete={isComplete}
        showGraph={showGraph}
        onShowGraphToggle={toggleGraph}
      />

      <NumPad onNumber={inputNumber} onErase={erase} remaining={remaining} />

      {showGraph && graph && (
        <div className="mt-4">
          <GraphView graph={graph} solution={solution} />
        </div>
      )}
    </div>
  );
}
