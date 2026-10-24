import { describe, expect, it } from 'vitest';
import { useGridStore } from '@/features/store';
import { CellKind } from '@/types/grid';
import { COLS, ROWS } from '@/utils/constants';

const api = () => useGridStore.getState();

describe('useGridStore', () => {
    it('starts with the default grid', () => {
        expect(api().rows).toBe(ROWS);
        expect(api().cols).toBe(COLS);
        expect(api().validStart()).toBe(true);
        expect(api().validGoal()).toBe(true);
    });

    it('idx / inBounds / at use row-major indexing', () => {
        expect(api().idx(2, 3)).toBe(2 * COLS + 3);
        expect(api().inBounds(0, 0)).toBe(true);
        expect(api().inBounds(ROWS, 0)).toBe(false);
        expect(api().inBounds(0, -1)).toBe(false);
        api().setCell(2, 3, CellKind.wall);
        expect(api().at(2, 3)).toBe(CellKind.wall);
    });

    describe('setCell', () => {
        it('sets a cell and replaces the cells array (so subscribers re-render)', () => {
            const before = api().cells;
            api().setCell(0, 0, CellKind.wall);
            expect(api().cells).not.toBe(before);
            expect(api().at(0, 0)).toBe(CellKind.wall);
        });

        it('ignores out-of-bounds cells', () => {
            const before = api().cells;
            api().setCell(-1, 0, CellKind.wall);
            api().setCell(0, COLS, CellKind.wall);
            expect(api().cells).toBe(before);
        });

        it('never overwrites the start or goal cell', () => {
            const { start, goal } = api();
            api().setCell(start.r, start.c, CellKind.wall);
            api().setCell(goal.r, goal.c, CellKind.wall);
            expect(api().at(start.r, start.c)).toBe(CellKind.empty);
            expect(api().at(goal.r, goal.c)).toBe(CellKind.empty);
        });

        it('skips the update when the cell already has that kind', () => {
            const before = api().cells;
            api().setCell(0, 0, CellKind.empty);
            expect(api().cells).toBe(before);
        });
    });

    it('fillWalls / clearWalls change every cell', () => {
        api().fillWalls();
        expect(api().cells.every((k) => k === CellKind.wall)).toBe(true);
        api().clearWalls();
        expect(api().cells.every((k) => k === CellKind.empty)).toBe(true);
    });

    describe('setStart / setGoal', () => {
        it('moves the marker', () => {
            api().setStart(1, 1);
            api().setGoal(2, 2);
            expect(api().start).toEqual({ r: 1, c: 1 });
            expect(api().goal).toEqual({ r: 2, c: 2 });
        });

        it('clamps to the grid', () => {
            api().setStart(-5, 2);
            expect(api().start).toEqual({ r: 0, c: 2 });
            api().setGoal(ROWS + 10, COLS + 10);
            expect(api().goal).toEqual({ r: ROWS - 1, c: COLS - 1 });
        });

        it('snaps off a wall to the nearest empty cell', () => {
            api().setCell(4, 4, CellKind.wall);
            api().setStart(4, 4);
            const { start } = api();
            expect(Math.abs(start.r - 4) + Math.abs(start.c - 4)).toBe(1);
        });

        it('refuses to put start on top of goal and vice versa', () => {
            const { start, goal } = api();
            api().setStart(goal.r, goal.c);
            expect(api().start).toEqual(start);
            api().setGoal(start.r, start.c);
            expect(api().goal).toEqual(goal);
        });

        it('(-1, -1) hides the marker, which makes it invalid', () => {
            api().setStart(-1, -1);
            api().setGoal(-1, -1);
            expect(api().validStart()).toBe(false);
            expect(api().validGoal()).toBe(false);
        });
    });

    describe('setDimensions', () => {
        it('resizes and clears the grid', () => {
            api().setCell(0, 0, CellKind.wall);
            api().setDimensions(10, 12);
            expect(api().rows).toBe(10);
            expect(api().cols).toBe(12);
            expect(api().cells).toHaveLength(120);
            expect(api().cells.every((k) => k === CellKind.empty)).toBe(true);
        });

        it('clamps dimensions to 2..300', () => {
            api().setDimensions(1, 1000);
            expect(api().rows).toBe(2);
            expect(api().cols).toBe(300);
        });

        it('keeps markers inside the new bounds', () => {
            api().setDimensions(5, 5);
            expect(api().validStart()).toBe(true);
            expect(api().validGoal()).toBe(true);
        });

        it('separates markers that would collapse onto the same cell', () => {
            api().setStart(0, 0);
            api().setGoal(0, 1);
            useGridStore.setState({ goal: { r: 0, c: 0 } });
            api().setDimensions(2, 2);
            expect(api().goal).not.toEqual(api().start);
        });
    });

    it('setCellSize clamps to 8..64', () => {
        api().setCellSize(2);
        expect(api().cellSize).toBe(8);
        api().setCellSize(100);
        expect(api().cellSize).toBe(64);
        api().setCellSize(30);
        expect(api().cellSize).toBe(30);
    });

    it('setGridLock toggles the lock', () => {
        api().setGridLock(true);
        expect(api().gridLock).toBe(true);
        api().setGridLock(false);
        expect(api().gridLock).toBe(false);
    });

    it('refresh bumps gridVersion; reset restores defaults', () => {
        api().refresh();
        api().refresh();
        expect(api().gridVersion).toBe(2);
        api().setCell(0, 0, CellKind.wall);
        api().reset();
        expect(api().gridVersion).toBe(0);
        expect(api().at(0, 0)).toBe(CellKind.empty);
    });
});
