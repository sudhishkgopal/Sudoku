//Grid constants
export const GRID_SIZE = 9;
export const BOX_SIZE = 3;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const BOX_COUNT = GRID_SIZE / BOX_SIZE;
export const DIGITS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const EMPTY_CELL = 0; //0 = blank cell

//Graph constants
export const TOTAL_EDGES = 810; //each of the 81 nodes has 20 edges, but since the graph is undirected we divide by 2
export const NUM_NEIGHBORS = 20; //each cell is connected to 20 other cells (8 in the same row, 8 in the same column, and 4 in the same box)
export const GRAPH_COLORS = GRID_SIZE;
export const COLOR_PALETTE = ['#e6194b', '#f78113', '#13930c', '#0fdae1', '#2a45f6', '#911eb4', '#6a4c19', '#ff4cf6', '#e6f60c'];

//Game modes
export const DIFFICULTY = {
  EASY: {label: "Easy", clues: 50},
  MEDIUM: {label: "Medium", clues: 40},
  HARD: {label: "Hard", clues: 30},
  EXPERT: {label: "Expert", clues: 21}
}

export const MIN_CLUES = 17; //minimum number of clues for a valid Sudoku puzzle
export const MAX_CLUES = 81; //maximum number of clues (a fully filled grid)