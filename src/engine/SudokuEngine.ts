import { GRID_SIZE, CELL_COUNT, BOX_SIZE, MAX_CLUES, MIN_CLUES, DIGITS, EMPTY_CELL } from './constants';

// A 9×9 grid. 0 represents an empty cell.
export type SudokuGrid = number[][];

// A single cell identified by its row and column (0-indexed).
export interface CageCell {
  row: number;
  col: number;
}

export interface Cage {
  id: number;
  cells: CageCell[];
  sum: number;
}

export interface PuzzleResult {
  // The puzzle presented to the player — 0 means empty cell.
  puzzle: SudokuGrid;
  // The unique, complete solution for validation and graph rendering.
  solution: SudokuGrid;
  graph: SudokuGraph;
}

export interface GraphNode {
  index: number; //0-80
  row: number; //0-8
  col: number; //0-8
}

export interface GraphEdge{
  source: number; //node index
  target: number; //node index
}

export interface SudokuGraph{
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacency: number[][] // 81×81 matrix of 0s and 1s; 1 means connected by edge
}

export class SudokuEngine {

  private buildGraph() : SudokuGraph {
  //initalizing graph data structure
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const adjacency: number[][] = Array.from({ length: CELL_COUNT }, () => []);

  for(let i = 0; i<CELL_COUNT; i++){
    nodes.push({index: i, row: Math.floor(i/GRID_SIZE), col: i%GRID_SIZE}); //creating nodes for each cell
  }
  //create edges for nodes that share a row, col, or box
  for(let i=0; i<CELL_COUNT; i++){
    const current_row = Math.floor(i/GRID_SIZE);
    const current_col = i%GRID_SIZE;
    const current_node = Math.floor(current_row/BOX_SIZE) *BOX_SIZE + Math.floor(current_col/BOX_SIZE); //calculating box index

    //
    for (let j=i+1; j<CELL_COUNT; j++){
      const target_row = Math.floor(j/GRID_SIZE);
      const target_col = j%GRID_SIZE;
      const target_node = Math.floor(target_row/BOX_SIZE) *BOX_SIZE + Math.floor(target_col/BOX_SIZE); //calculating box index

      //if nodes share a row, col, or box they are connected by an edge
      if(current_row === target_row || current_col === target_col || current_node === target_node){
        edges.push({source: i, target: j}); //adding edge between connected nodes
        adjacency[i].push(j);
        adjacency[j].push(i); //undirected edge
      }
    }
  }
  return {nodes, edges, adjacency};
}

  // TODO:
  //   1. Loop from the last index down to 1:
  //        a. Pick a random index j between 0 and i (inclusive)
  //        b. Swap elements at i and j
  //   2. Return the shuffled copy
  private shuffle<T>(array: T[]): T[] {
    for(let i = array.length - 1; i>0; i--){
      const j = Math.floor(Math.random() * (i+1));
      [array[i], array[j]] = [array[j], array[i]]; //swap
    }
    return array;
  }

  // TODO:
  //   1. Map each row to a shallow copy of that row ([...row])
  //   2. Return the new 9-element array of copied rows

  private clone(grid: SudokuGrid): SudokuGrid {
      return grid.map(row => [...row]);
  }

  // TODO:
  //   1. ROW CHECK — scan all 9 columns in `row`; if any equals `num`
  //   2. COLUMN CHECK — scan all 9 rows in `col`; if any equals `num`
  //   3. BOX CHECK:
  //        a. boxRow = floor(row / 3) * 3   (top-left corner of the 3×3 box)
  //        b. boxCol = floor(col / 3) * 3
  //        c. Scan the 3×3 region; if any cell equals `num`
  //   4. All checks passed return true
  private isValid(grid: SudokuGrid, row: number, col: number, num: number): boolean {
    for(let current_row = 0; current_row<GRID_SIZE; current_row++){
      if(grid[current_row][col] === num) return false; //column check
    }
    for(let current_col = 0; current_col <GRID_SIZE; current_col++){
      if(grid[row][current_col] ===num) return false; //row check
    }
    const boxRow = Math.floor(row/BOX_SIZE) *BOX_SIZE; //3x3 box for row check
    const boxCol = Math.floor(col/BOX_SIZE) *BOX_SIZE; //3x3 box for column check
    for(let r = boxRow; r<boxRow +BOX_SIZE; r++){
      for(let c = boxCol; c<boxCol +BOX_SIZE; c++){
        if(grid[r][c] === num) return false; //box check
      }
    }
    return true; //all checks passed
  }

  // TODO:
  //   1. Scan the grid row-by-row, column-by-column for the first 0 (empty cell)
  //   2. If no empty cell is found → return true (board is complete)
  //   3. Shuffle the digits [1..9] for randomness
  //   4. For each digit in the shuffled list:
  //        a. If isValid(grid, row, col, digit):
  //             i.  Place digit at grid[row][col]
  //             ii. Recursively call fillBoard(grid)
  //             iii.If recursion returns true → return true (solution found)
  //             iv. Otherwise reset grid[row][col] = 0  (backtrack)
  //   5. No digit worked return false (trigger backtrack in caller)

  private fillBoard(grid: SudokuGrid, adjacency: number[][]): boolean {
    for(let i=0; i<CELL_COUNT; i++){
      const row = Math.floor(i/GRID_SIZE);
      const col = i%GRID_SIZE;
      if(grid[row][col] === EMPTY_CELL){ //empty cell found
        const digits = this.shuffle([...DIGITS]); //shuffle digits for randomness
        for(const digit of digits){
          if(this.isValid(grid, row, col, digit)){ //check if digit can be placed
            grid[row][col] = digit;
            if(this.fillBoard(grid, adjacency)) return true; //recurse
            grid[row][col] = EMPTY_CELL; //backtrack
          }
        }
        return false; //no valid digit found, trigger backtrack
      }
      
    }
    return true;
  }


  // TODO:
  //   1. Create a 9×9 grid filled with 0s
  //   2. Call fillBoard(grid)
  //   3. Return the completed grid
  private generateSolution(adjacency: number[][]): SudokuGrid {
  
    const grid: SudokuGrid = Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(EMPTY_CELL));
    this.fillBoard(grid, adjacency);
    return grid;
  }


  // TODO:
  //   1. Find the first empty cell scanning row-by-row
  //   2. If no empty cell exists return 1  (a complete solution was found)
  //   3. Initialize count = 0
  //   4. For each digit:
  //        a. If isValid(grid, row, col, digit):
  //             i.  Place digit at grid[row][col]
  //             ii. count += countSolutions(grid, limit - count)
  //             iii.Reset grid[row][col] = 0
  //             iv. If count >= limit → return count early  (stop searching)
  //   5. Return count
  private countSolutions(grid: SudokuGrid, adjacency: number[][], limit: number): number {
    // TODO: implement solution counter with early exit
    for(let i=0; i<CELL_COUNT; i++){
      const row = Math.floor(i/GRID_SIZE);
      const col = i%GRID_SIZE;
      if(grid[row][col] === EMPTY_CELL){ //empty cell found
        let count = 0;
        for(const digit of DIGITS){
          if(this.isValid(grid, row, col, digit)){
            grid[row][col] = digit; //place digit
            count += this.countSolutions(grid, adjacency, limit - count); //recurse
            grid[row][col] = EMPTY_CELL; //reset cell
            if(count >= limit) return count; //early exit
          }
        }
        return count; //return count for this cell
      }
    }
    return 1; //complete solution found
  }

  // TODO:
  //   1. Clamp clueCount to [17, 81]
  //        — 17 is the proven minimum for a unique-solution puzzle
  //   2. Generate a complete solution via generateSolution()
  //   3. Clone the solution into `puzzle` (this is what will be "dug")
  //   4. Build a list of all 81 [row, col] positions and shuffle it
  //   5. Track cluesLeft = 81
  //   6. For each [row, col] in the shuffled list:
  //        a. If cluesLeft <= target,then stop
  //        b. Save backup = puzzle[row][col], then set it to 0
  //        c. Count solutions on a CLONE of puzzle (limit = 2)
  //        d. If solutions === 1, then cell removed successfully and cluesLeft--
  //        e. Else restore puzzle[row][col] = backup (removal breaks uniqueness)
  //   7. Return { puzzle, solution }

  public generatePuzzle(clueCount: number): PuzzleResult {
    const clues = Math.max(MIN_CLUES, Math.min(MAX_CLUES, clueCount)); 
    const graph = this.buildGraph();
    const solution = this.generateSolution(graph.adjacency);
    const puzzle = this.clone(solution);
    const positions = this.shuffle(Array.from({length: CELL_COUNT}, (_, i) => [Math.floor(i/GRID_SIZE), i%GRID_SIZE])); //shuffled list of cell positions
    let cluesLeft = CELL_COUNT;

    for(const [row, col] of positions){
      if(cluesLeft <= clues) break;
      //const row = Math.floor(index/GRID_SIZE);
      //const col = index%GRID_SIZE;
      const backup = puzzle[row][col];
      puzzle[row][col] = EMPTY_CELL;
      if(this.countSolutions(this.clone(puzzle), graph.adjacency, 2) === 1){ //check uniqueness on clone
        cluesLeft--; //removal successful
      } else {
        puzzle[row][col] = backup; //restore cell
      }
    }
    return {puzzle, solution, graph};
  }


  // TODO:
  //   1. Create a 9×9 boolean `assigned` grid, all false
  //   2. Shuffle all 81 cells to use as random cage seeds
  //   3. For each seed cell (skip if already assigned):
  //        a. Pick a random target cage size (weighted: 1:1, 2:3, 3:3, 4:2, 5:1)
  //        b. Start cage with [seed]; mark seed as assigned
  //        c. GROW LOOP — while cage.length < targetSize:
  //             i.  Build a frontier: all unassigned orthogonal neighbours of
  //                 every cell currently in the cage (deduplicated by key "r,c")
  //             ii. If frontier is empty, break (cage is surrounded)
  //             iii.Pick a random cell from the frontier
  //             iv. Add it to the cage and mark it assigned
  //        d. sum = solution[r][c] for each cell in the cage
  //        e. Push { id, cells, sum } to cages array
  //   4. Return cages

  public generateCages(solution: SudokuGrid, _graph: SudokuGraph, puzzle?: SudokuGrid): Cage[] {
    const assigned = new Array(CELL_COUNT).fill(false); //flat boolean array indexed by flat cell index
    const cages: Cage[] = [];
    let nextId = 0;

    // Weights for sizes 2, 3, 4, 5, 6
    const sizeWeights = [3, 4, 3, 2, 1]; 
    const totalWieght = sizeWeights.reduce((a, b) => a + b, 0);

    const pickSize = (): number =>{
      let r = Math.random() * totalWieght;
      for(let i=0; i<sizeWeights.length; i++){
        r -= sizeWeights[i];
        if(r <= 0) return i+2; // Output sizes 2 through 6
      }
      return 2; //fallback
    };

    const orthogonalNeightbors = (index: number): number[] =>{
      const row = Math.floor(index/GRID_SIZE);
      const col = index%GRID_SIZE;

      return([[row-1,col], [row+1,col], [row,col-1], [row,col+1]] as [number, number][]) //orthogonal neighbors
        .filter(([r, c]) => r>=0 && r<GRID_SIZE && c>=0 && c<GRID_SIZE && !assigned[r*GRID_SIZE + c]) //in bounds and unassigned
        .map(([r, c]) => r*GRID_SIZE + c); //convert to flat index
    };

    for(const seed of this.shuffle(Array.from({length: CELL_COUNT}, (_, i) => i))){ //shuffled cell indices
      if(assigned[seed]) continue;

      const cageIndicies: number[] = [seed];
      assigned[seed] = true;
      const targetSize = pickSize();

      while(cageIndicies.length < targetSize || (puzzle && cageIndicies.every(index => puzzle[Math.floor(index/GRID_SIZE)][index%GRID_SIZE] !== EMPTY_CELL))){
        const frontier = new Map<number, number>(); //flat index to flat index

        for(const index of cageIndicies){
          for(const neighbor of orthogonalNeightbors(index)){
            frontier.set(neighbor, neighbor);
          }
        }

        if(frontier.size === 0) break; //cage is surrounded

        const candidates = [...frontier.values()];
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        cageIndicies.push(next);
        assigned[next] = true;
      }

      const cells: CageCell[] = cageIndicies.map(index =>({
        row: Math.floor(index/GRID_SIZE),
        col: index%GRID_SIZE
      }));
      const sum = cells.reduce((acc, cell) => acc + solution[cell.row][cell.col], 0);
      cages.push({id: nextId++, cells, sum});
    }

    let changed = true;
    while(changed) {
      changed = false;
      for (let i = 0; i < cages.length; i++) {
        const cage = cages[i];
        const isSizeInvalid = cage.cells.length < 2;
        const isPreComplete = puzzle ? cage.cells.every((c: CageCell) => puzzle[c.row][c.col] !== EMPTY_CELL) : false;

        if (isSizeInvalid || isPreComplete) {
          const cageCellKeys = new Set(cage.cells.map((c: CageCell) => `${c.row},${c.col}`));
          const adjacentCages = cages.filter(c => 
            c.id !== cage.id && 
            c.cells.some((cell: CageCell) => 
              cageCellKeys.has(`${cell.row-1},${cell.col}`) ||
              cageCellKeys.has(`${cell.row+1},${cell.col}`) ||
              cageCellKeys.has(`${cell.row},${cell.col-1}`) ||
              cageCellKeys.has(`${cell.row},${cell.col+1}`)
            )
          );

          if (adjacentCages.length > 0) {
            adjacentCages.sort((a, b) => a.cells.length - b.cells.length);
            let targetCage = adjacentCages.find(c => c.cells.length + cage.cells.length <= 6);
            if (!targetCage) {
              targetCage = adjacentCages[0];
            }
            targetCage.cells.push(...cage.cells);
            targetCage.sum += cage.sum;
            cages.splice(i, 1);
            changed = true;
            break;
          }
        }
      }
    }

    return cages;
  }

  }

