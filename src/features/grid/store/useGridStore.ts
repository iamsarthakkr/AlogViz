'use client';
import { create } from 'zustand';
import { CellKind, GridState } from '../types';
import { clamp, initGrid, nearestEmptyCell } from '../utils';

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

        setDimensions: (R, C) =>
            set((s: GridState) => {
                const rows = clamp(R, 2, 300);
                const cols = clamp(C, 2, 300);

                const cells: CellKind[] = Array(rows * cols).fill(CellKind.empty);

                const start = {
                    r: clamp(s.start.r, 0, rows - 1),
                    c: clamp(s.start.c, 0, cols - 1),
                };
                let goal = {
                    r: clamp(s.goal.r, 0, rows - 1),
                    c: clamp(s.goal.c, 0, cols - 1),
                };

                if (start.r === goal.r && start.c === goal.c) {
                    const altC = clamp(goal.c + 1, 0, cols - 1);
                    goal = { r: goal.r, c: altC === start.c ? clamp(goal.c - 1, 0, cols - 1) : altC };
                }

                return { rows, cols, cells, start, goal, gridVersion: s.gridVersion + 1 };
            }),

        setCellSize: (px) => set({ cellSize: clamp(px, 8, 64) }),

        setCell: (r, c, kind) =>
            set((s: GridState) => {
                if (!s.inBounds(r, c)) return {};
                // don’t overwrite markers
                if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return {};
                const k = s.idx(r, c);
                if (s.cells[k] === kind) return {};
                const next = s.cells.slice();
                next[k] = kind;
                return { cells: next, gridVersion: s.gridVersion + 1 };
            }),

        toggleWall: (r, c) => {
            const s = get();
            if (!s.inBounds(r, c)) return;
            if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return;
            const k = s.idx(r, c);
            const next = s.cells.slice();
            next[k] = next[k] === CellKind.wall ? CellKind.empty : CellKind.wall;
            set({ cells: next, gridVersion: s.gridVersion + 1 });
        },

        clearWalls: () =>
            set((s: GridState) => ({
                cells: s.cells.map(() => CellKind.empty),
                gridVersion: s.gridVersion + 1,
            })),

        randomWalls: (p) =>
            set((s: GridState) => {
                const prob = clamp(p, 0, 1);
                const next = s.cells.slice();
                for (let r = 0; r < s.rows; r++) {
                    for (let c = 0; c < s.cols; c++) {
                        if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) continue;
                        next[r * s.cols + c] = Math.random() < prob ? CellKind.wall : CellKind.empty;
                    }
                }
                return { cells: next, gridVersion: s.gridVersion + 1 };
            }),

        setStart: (r, c) =>
            set((s: GridState) => {
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                const snapped = nearestEmptyCell(r, c, s.rows, s.cols, s.cells);
                if (snapped.r === s.goal.r && snapped.c === s.goal.c) return {};
                return { start: snapped, gridVersion: s.gridVersion + 1 };
            }),

        setGoal: (r, c) =>
            set((s: GridState) => {
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                const snapped = nearestEmptyCell(r, c, s.rows, s.cols, s.cells);
                if (snapped.r === s.start.r && snapped.c === s.start.c) return {};
                return { goal: snapped, gridVersion: s.gridVersion + 1 };
            }),

        reset: () => set(initGrid()),
    };
});
