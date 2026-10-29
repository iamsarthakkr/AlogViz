// Authored by - Sarthak Kumar
//
// layout utils: sizes the grid to the box it is rendered in.
// - pickGridLayout (on load): cols from COL_PRESETS by box width, rows from the height, cell size to fit
// - fitCellSize (on resize): rows/cols stay fixed, only the cell size is recomputed
// - rows/cols are always odd: the maze generators carve on odd indices inside a wall border
// - cell size is clamped to [MIN_CELL, MAX_CELL]; below the minimum the grid overflows its box rather than shrink

import { GridLayout } from '@/types/grid';
import { COL_PRESETS, MAX_ROWS, MAX_CELL, MIN_ROWS, MIN_CELL, TARGET_CELL } from './constants';
import { clamp } from './common';

const toOdd = (val: number): number => {
    return val & 1 ? val : val - 1;
};

// on load: choose dimensions for this screen, then size cells to fill the space
export const pickGridLayout = (availW: number, availH: number): GridLayout => {
    let cols = COL_PRESETS[0];

    for (const presetCols of [...COL_PRESETS].reverse()) {
        if (availW / presetCols >= TARGET_CELL) {
            cols = presetCols;
            break;
        }
    }
    const fitSize = clamp(Math.floor(availW / cols), MIN_CELL, MAX_CELL);

    let rows = Math.floor(availH / fitSize);
    rows = clamp(rows, MIN_ROWS, MAX_ROWS);
    rows = toOdd(rows);

    return {
        rows,
        cols,
        cellSize: fitCellSize(availW, availH, rows, cols),
    };
};

// on resize: dimensions stay, only the cell size changes
export const fitCellSize = (availW: number, availH: number, rows: number, cols: number): number => {
    return clamp(Math.min(Math.floor(availW / cols), Math.floor(availH / rows)), MIN_CELL, MAX_CELL);
};
