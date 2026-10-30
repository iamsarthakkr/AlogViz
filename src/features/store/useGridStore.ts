// Authored by - Sarthak Kumar
//
// useGridStore: single source of truth for the grid itself.
// - Flat CellKind[] cell array (index = r*cols+c), start/goal markers, dimensions
// - weights: parallel flat array, the cost to enter each cell. Only plain cells carry weight: walls
//   reset it and setWeight refuses walls and markers. A marker dropped on terrain keeps the stored
//   weight so the terrain is back when it moves on (getGridSnapshot makes it not count)
// - Mutators no-op (return {}) when nothing would change, so subscribers don't re-render
// - gridVersion is the manual dirty flag other hooks watch to invalidate cached runs
// - gridLock disables pointer edits while an algorithm/maze is running
// - setStart/setGoal snap to the nearest non-wall cell instead of landing on a wall

import { create } from 'zustand';
import { CellKind, GridState } from '@/types/grid';
import { initGrid, nearestEmptyCell } from '@/utils/grid';
import { clamp } from '@/utils/common';
import { DEFAULT_WEIGHT, MAX_CELL, MIN_CELL } from '@/utils/constants';

export const useGridStore = create<GridState>((set, get) => {
    const g = initGrid();

    return {
        ...g,

        idx: (r, c) => r * get().cols + c,
        inBounds: (r, c) => r >= 0 && c >= 0 && r < get().rows && c < get().cols,

        at: (r, c) => {
            const s = get();
            return s.cells[s.idx(r, c)];
        },

        setGridLock: (flag) => {
            set(() => ({ gridLock: flag }));
        },

        setWall: (r, c) => {
            set((s) => {
                if (!s.inBounds(r, c)) return {};
                // don’t overwrite markers
                if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return {};
                const id = s.idx(r, c);
                if (s.cells[id] === CellKind.wall) return {};

                const newCells = s.cells.slice();
                const newWeights = s.weights.slice();
                newCells[id] = CellKind.wall;
                newWeights[id] = DEFAULT_WEIGHT;

                return { cells: newCells, weights: newWeights };
            });
        },

        clearWall: (r, c) => {
            set((s) => {
                if (!s.inBounds(r, c)) return {};
                const id = s.idx(r, c);
                if (s.cells[id] !== CellKind.wall) return {};

                const newCells = s.cells.slice();
                newCells[id] = CellKind.empty;

                return { cells: newCells };
            });
        },

        fillWalls: () => {
            set((s) => ({
                cells: s.cells.slice().fill(CellKind.wall),
                weights: s.weights.slice().fill(DEFAULT_WEIGHT),
            }));
        },

        clearWalls: () => {
            set((s) => ({
                cells: s.cells.slice().fill(CellKind.empty),
            }));
        },

        setWeight: (r, c, w) => {
            set((s) => {
                if (!s.inBounds(r, c) || w < DEFAULT_WEIGHT) return {};
                // don’t overwrite markers
                if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return {};

                const id = s.idx(r, c);
                if (s.cells[id] === CellKind.wall || s.weights[id] === w) return {};

                const newWeights = s.weights.slice();
                newWeights[id] = w;

                return { weights: newWeights };
            });
        },

        clearWeight: (r, c) => {
            set((s) => {
                if (!s.inBounds(r, c)) return {};
                const id = s.idx(r, c);
                if (s.cells[id] === CellKind.wall || s.weights[id] === DEFAULT_WEIGHT) return {};

                const newWeights = s.weights.slice();
                newWeights[id] = DEFAULT_WEIGHT;

                return { weights: newWeights };
            });
        },

        clearWeights: () => {
            set((s) => {
                let hadWeights = false;
                const newWeights = s.weights.slice();
                for (let i = 0; i < newWeights.length; i++) {
                    if (newWeights[i] !== DEFAULT_WEIGHT) {
                        newWeights[i] = DEFAULT_WEIGHT;
                        hadWeights = true;
                    }
                }
                return hadWeights ? { weights: newWeights } : {};
            });
        },

        setStart: (r, c) =>
            set((s: GridState) => {
                if (r < 0 && c <= 0) {
                    return { start: { r: -1, c: -1 } };
                }
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                const snapped = nearestEmptyCell(r, c, s.rows, s.cols, s.cells);
                if (snapped.r === s.goal.r && snapped.c === s.goal.c) return {};
                return { start: snapped };
            }),

        setGoal: (r, c) =>
            set((s: GridState) => {
                if (r < 0 && c <= 0) {
                    return { goal: { r: -1, c: -1 } };
                }
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                const snapped = nearestEmptyCell(r, c, s.rows, s.cols, s.cells);
                if (snapped.r === s.start.r && snapped.c === s.start.c) return {};
                return { goal: snapped };
            }),

        validStart: () => {
            const s = get();
            return s.inBounds(s.start.r, s.start.c);
        },
        validGoal: () => {
            const s = get();
            return s.inBounds(s.goal.r, s.goal.c);
        },

        reset: (rows, cols, cellSize) =>
            set((s) => {
                const grid = initGrid(rows, cols, cellSize);
                grid.gridVersion = s.gridVersion + 1;
                return grid;
            }),

        resize: (cellSize) =>
            set((s) => {
                const finalCellSize = clamp(cellSize, MIN_CELL, MAX_CELL);
                return s.cellSize === finalCellSize ? {} : { cellSize: finalCellSize, gridVersion: s.gridVersion + 1 };
            }),

        refresh: () => set((s) => ({ gridVersion: s.gridVersion + 1 })),
    };
});
