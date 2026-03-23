import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SudokuEngine } from '../engine/SudokuEngine';
import type { SudokuGrid, SudokuGraph, Cage } from '../engine/SudokuEngine';
import { DIFFICULTY, GRID_SIZE, EMPTY_CELL } from '../engine/constants';

const engine = new SudokuEngine();

export type Difficulty = keyof typeof DIFFICULTY;

// Stored as plain number arrays (JSON-serializable, unlike Set)
export type Notes = number[][][];

interface GameState {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
  graph: SudokuGraph | null;
  userGrid: SudokuGrid;
  notes: Notes;
  selectedCell: [number, number] | null;
  notesMode: boolean;
  history: SudokuGrid[];
  isComplete: boolean;
  showGraph: boolean;
  difficulty: Difficulty;
  elapsed: number;
  killerMode: boolean;
  cages: Cage[];
}

interface GameActions {
  startNewGame: (diff: Difficulty) => void;
  selectCell: (row: number, col: number) => void;
  inputNumber: (num: number) => void;
  erase: () => void;
  undo: () => void;
  toggleNotes: () => void;
  toggleGraph: () => void;
  toggleKillerMode: () => void;
  tick: () => void;
  moveSelection: (dr: number, dc: number) => void;
}

const emptyNotes = (): Notes =>
  Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => []),
  );

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      puzzle: [],
      solution: [],
      graph: null,
      userGrid: [],
      notes: emptyNotes(),
      selectedCell: null,
      notesMode: false,
      history: [],
      isComplete: false,
      showGraph: false,
      difficulty: 'MEDIUM',
      elapsed: 0,
      killerMode: false,
      cages: [],

      startNewGame: (diff) => {
        const { killerMode } = get();
        const result = engine.generatePuzzle(DIFFICULTY[diff].clues);
        const cages = killerMode ? engine.generateCages(result.solution, result.graph, result.puzzle) : [];
        set({
          puzzle: result.puzzle,
          solution: result.solution,
          graph: result.graph,
          userGrid: result.puzzle.map((row) => [...row]),
          notes: emptyNotes(),
          selectedCell: null,
          history: [],
          isComplete: false,
          showGraph: false,
          notesMode: false,
          elapsed: 0,
          difficulty: diff,
          cages,
        });
      },

      toggleKillerMode: () => {
        const { killerMode, difficulty } = get();
        const newKillerMode = !killerMode;
        const result = engine.generatePuzzle(DIFFICULTY[difficulty].clues);
        const cages = newKillerMode ? engine.generateCages(result.solution, result.graph, result.puzzle) : [];
        set({
          killerMode: newKillerMode,
          puzzle: result.puzzle,
          solution: result.solution,
          graph: result.graph,
          userGrid: result.puzzle.map((row) => [...row]),
          notes: emptyNotes(),
          selectedCell: null,
          history: [],
          isComplete: false,
          showGraph: false,
          notesMode: false,
          elapsed: 0,
          cages,
        });
      },

      selectCell: (row, col) => {
        const { puzzle } = get();
        if (puzzle[row]?.[col] !== EMPTY_CELL) return;
        set({ selectedCell: [row, col] });
      },

      inputNumber: (num) => {
        const { selectedCell, puzzle, notesMode, notes, userGrid, solution } = get();
        if (!selectedCell) return;
        const [row, col] = selectedCell;
        if (puzzle[row][col] !== EMPTY_CELL) return;

        if (notesMode) {
          const newNotes = notes.map((r) => r.map((c) => [...c]));
          const cell = newNotes[row][col];
          const idx = cell.indexOf(num);
          if (idx !== -1) cell.splice(idx, 1);
          else cell.push(num);
          set({ notes: newNotes });
          return;
        }

        const newGrid = userGrid.map((r) => [...r]);
        newGrid[row][col] = num;
        const complete = newGrid.every((r, ri) =>
          r.every((v, ci) => v === solution[ri][ci]),
        );
        set({
          history: [...get().history, userGrid.map((r) => [...r])],
          userGrid: newGrid,
          ...(complete && { isComplete: true }),
        });
      },

      erase: () => {
        const { selectedCell, userGrid, puzzle } = get();
        if (!selectedCell) return;
        const [row, col] = selectedCell;
        if (puzzle[row][col] !== EMPTY_CELL) return;
        const newGrid = userGrid.map((r) => [...r]);
        newGrid[row][col] = EMPTY_CELL;
        set({
          history: [...get().history, userGrid.map((r) => [...r])],
          userGrid: newGrid,
        });
      },

      undo: () => {
        const { history } = get();
        if (!history.length) return;
        set({
          userGrid: history[history.length - 1],
          history: history.slice(0, -1),
        });
      },

      toggleNotes: () => set((s) => ({ notesMode: !s.notesMode })),
      toggleGraph: () => set((s) => ({ showGraph: !s.showGraph })),

      tick: () => {
        if (!get().isComplete) set((s) => ({ elapsed: s.elapsed + 1 }));
      },

      moveSelection: (dr, dc) => {
        const { selectedCell } = get();
        const [r, c] = selectedCell ?? [0, 0];
        set({
          selectedCell: [
            Math.max(0, Math.min(GRID_SIZE - 1, r + dr)),
            Math.max(0, Math.min(GRID_SIZE - 1, c + dc)),
          ],
        });
      },
    }),
    {
      name: 'graph-sudoku-game',
      storage: createJSONStorage(() => localStorage),
      // history and showGraph are excluded — undo stack resets on reload,
      // graph view always starts hidden
      partialize: (s) => ({
        puzzle: s.puzzle,
        solution: s.solution,
        graph: s.graph,
        userGrid: s.userGrid,
        notes: s.notes,
        selectedCell: s.selectedCell,
        notesMode: s.notesMode,
        isComplete: s.isComplete,
        difficulty: s.difficulty,
        elapsed: s.elapsed,
        killerMode: s.killerMode,
        cages: s.cages,
      }),
    },
  ),
);
