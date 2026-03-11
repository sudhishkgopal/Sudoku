import {useEffect, useRef} from "react";
import * as d3 from "d3";
import type { SudokuGraph } from "../engine/SudokuEngine";
import type { SudokuGrid } from "../engine/SudokuEngine";
import { COLOR_PALETTE, EMPTY_CELL } from "../engine/constants";