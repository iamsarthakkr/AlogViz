'use client';
import { create } from 'zustand';

export type Coord = { r: number; c: number };
export enum CellKind {
    empty = 'empty',
    wall = 'wall',
}

type GridState = {
    rows: number;
    cols: number;
    cellSize: number;
    cells: CellKind[];
    start: Coord;
    goal: Coord;

    idx(r: number, c: number): number;
    inBounds(r: number, c: number): boolean;

    setDimensions(rows: number, cols: number): void;
    setCellSize(px: number): void;

    setCell(r: number, c: number, kind: CellKind): void;
    toggleWall(r: number, c: number): void;
    clearWalls(): void;
    randomWalls(p: number): void;

    setStart(r: number, c: number): void;
    setGoal(r: number, c: number): void;

    reset(): void;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function initGrid(rows = 25, cols = 45, cellSize = 22) {
    const cells: CellKind[] = Array(rows * cols).fill(CellKind.empty);
    const start = { r: Math.floor(rows / 2), c: Math.floor(cols / 6) };
    const goal = { r: Math.floor(rows / 2), c: Math.floor((cols * 5) / 6) };
    return { rows, cols, cellSize, cells, start, goal };
}

export const useGridStore = create<GridState>((set, get) => {
    const g = initGrid();

    return {
        ...g,

        idx: (r, c) => r * get().cols + c,
        inBounds: (r, c) => r >= 0 && c >= 0 && r < get().rows && c < get().cols,

        setDimensions: (R, C) =>
            set((s: GridState) => {
                const rows = clamp(R, 2, 300);
                const cols = clamp(C, 2, 300);

                // simple: reset walls on resize (you can preserve later)
                const cells: CellKind[] = Array(rows * cols).fill(CellKind.empty);

                const start = {
                    r: clamp(s.start.r, 0, rows - 1),
                    c: clamp(s.start.c, 0, cols - 1),
                };
                let goal = {
                    r: clamp(s.goal.r, 0, rows - 1),
                    c: clamp(s.goal.c, 0, cols - 1),
                };

                // avoid overlap after clamping
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

        toggleWall: (r, c) => {
            const s = get() as GridState;
            if (!s.inBounds(r, c)) return;
            if ((s.start.r === r && s.start.c === c) || (s.goal.r === r && s.goal.c === c)) return;
            const k = s.idx(r, c);
            const next = s.cells.slice();
            next[k] = next[k] === CellKind.wall ? CellKind.empty : CellKind.wall;
            set({ cells: next });
        },

        clearWalls: () =>
            set((s: GridState) => ({
                cells: s.cells.map(() => CellKind.empty),
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
                return { cells: next };
            }),

        setStart: (r, c) =>
            set((s: GridState) => {
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                if (r === s.goal.r && c === s.goal.c) return {};
                // optional: forbid start on a wall
                // if (s.cells[s.idx(r,c)] === 'wall') return {};
                return { start: { r, c } };
            }),

        setGoal: (r, c) =>
            set((s: GridState) => {
                r = clamp(r, 0, s.rows - 1);
                c = clamp(c, 0, s.cols - 1);
                if (r === s.start.r && c === s.start.c) return {};
                // if (s.cells[s.idx(r,c)] === 'wall') return {};
                return { goal: { r, c } };
            }),

        reset: () => set(initGrid()),
    };
});
