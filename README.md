# 🧩 Graph Sudoku 

**[Play Live on Vercel: graphsudoku.vercel.app](https://graphsudoku.vercel.app/)**

An advanced, interactive Sudoku web application that beautifully bridges classic puzzle mechanics with **Graph Theory**.

## 💡 The Motivation

I play Sudoku regularly, and over time, it became more than just a passing hobby—it became a fascinating puzzle of logic and constraints. As a developer, I wanted to build an application that physically embodies this interest. More importantly, I wanted to explore the underlying mathematics of Sudoku by combining my love for the game with **Graph Theory**. 

This project was built to create a polished, deployable application that showcases both my technical interests and my passion for problem-solving. It demonstrates the intersection of theoretical computer science and interactive web development.

## ✨ Features

- **Classic & Killer Sudoku**: Play traditional Sudoku or challenge yourself with Killer Sudoku (cages with target sums).
- **Graph Visualization**: Toggle a live Graph View that visually represents the Sudoku board as a mathematical graph. Nodes are cells, and edges represent the constraints (rows, columns, and 3x3 boxes).
- **Intelligent Puzzle Generation**: Employs a backtracking algorithm to generate guaranteed unique, solvable puzzles on the fly across multiple difficulties.
- **Modern User Experience**: Features dark/light mode, keyboard navigation, undo functionality, note-taking mode, and a built-in timer.
- **Responsive Design**: Carefully crafted with Tailwind CSS for a seamless experience on both desktop and mobile devices.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Visualization**: D3.js (for graph representations)
- **Deployment**: Local PWA support via Vite PWA plugin

## 🧮 How Graph Theory Meets Sudoku

Every Sudoku board can be abstracted as a graph constraint satisfaction problem:
- **Nodes (Vertices)**: The 81 cells of the grid.
- **Edges**: Connections between cells that cannot share the same number. Edges are drawn between nodes that reside in the same row, same column, or same 3x3 box.

By implementing this architecture, the application doesn't just treat the board as a 2D array, but as an adjacency matrix. This approach enables specialized solving algorithms and allows the user to visualize the constraints interactively through the built-in D3.js Graph View.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/graph-sudoku.git
   cd graph-sudoku
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/graph-sudoku/issues).

## 📝 License

This project is open-source and available under the MIT License.
