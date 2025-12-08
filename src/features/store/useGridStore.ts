'use client';
import { create } from 'zustand';
import { CellKind, GridState } from '@/types/grid';
import { initGrid, nearestEmptyCell } from '@/utils/grid';
import { clamp } from '@/utils/common';

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

                return { rows, cols, cells, start, goal };
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

        refresh: () => set((s) => ({ gridVersion: s.gridVersion + 1 })),
        reset: () => set(initGrid()),
    };
});
