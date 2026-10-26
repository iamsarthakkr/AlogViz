// Authored by - Sarthak Kumar
//
// useGridStore: single source of truth for the grid itself.
// - Flat CellKind[] cell array (index = r*cols+c), start/goal markers, dimensions
// - gridVersion is the manual dirty flag other hooks watch to invalidate cached runs
// - gridLock disables pointer edits while an algorithm/maze is running
// - setStart/setGoal snap to the nearest non-wall cell instead of landing on a wall

import { create } from 'zustand';
import { CellKind, GridState } from '@/types/grid';
import { initGrid, nearestEmptyCell } from '@/utils/grid';
import { clamp } from '@/utils/common';
import { MAX_CELL, MIN_CELL } from '@/utils/constants';

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

        setCell: (r, c, kind) =>
            set((s: GridState) => {
                if (!s.inBounds(r, c)) return {};
                // don’t overwrite markers
                if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return {};
                const k = s.idx(r, c);
                if (s.cells[k] === kind) return {};
                const next = s.cells.slice();
                next[k] = kind;
                return { cells: next };
            }),

        clearWalls: () =>
            set((s: GridState) => ({
                cells: s.cells.map(() => CellKind.empty),
            })),

        fillWalls: () =>
            set((state) => ({
                cells: state.cells.map(() => CellKind.wall),
            })),

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
