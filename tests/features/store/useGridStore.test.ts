import { describe, expect, it } from 'vitest';
import { useGridStore } from '@/features/store';
import { CellKind } from '@/types/grid';
import { CELL_SIZE, COL_PRESETS, COLS, MAX_CELL, MIN_CELL, MIN_ROWS, ROWS } from '@/utils/constants';
import { initGrid } from '@/utils/grid';

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

    describe('reset', () => {
        const layout = { rows: MIN_ROWS, cols: COL_PRESETS[0], cellSize: MIN_CELL };
        const resetTo = () => api().reset(layout.rows, layout.cols, layout.cellSize);

        it('builds an empty grid of the given size', () => {
            api().setCell(0, 0, CellKind.wall);
            resetTo();
            expect(api()).toMatchObject(layout);
            expect(api().cells).toHaveLength(layout.rows * layout.cols);
            expect(api().cells.every((k) => k === CellKind.empty)).toBe(true);
        });

        it('places start and goal for the new size, as initGrid does', () => {
            api().setStart(0, 0);
            resetTo();
            const expected = initGrid(layout.rows, layout.cols, layout.cellSize);
            expect(api().start).toEqual(expected.start);
            expect(api().goal).toEqual(expected.goal);
        });

        it('restores the default grid when called without a size', () => {
            resetTo();
            api().reset();
            expect(api()).toMatchObject({ rows: ROWS, cols: COLS, cellSize: CELL_SIZE });
        });

        it('releases the grid lock', () => {
            api().setGridLock(true);
            api().reset();
            expect(api().gridLock).toBe(false);
        });

        // runners are cached by the gridVersion they were built from; restarting at 0 would let a
        // runner built for the old grid look current
        it('bumps gridVersion instead of restarting it', () => {
            api().refresh();
            const version = api().gridVersion;
            api().reset();
            expect(api().gridVersion).toBe(version + 1);
        });
    });

    describe('resize', () => {
        const otherSize = CELL_SIZE + 1; // CELL_SIZE is the default, so this always changes it

        it('changes only the cell size: dimensions, walls and markers are kept', () => {
            api().setCell(0, 0, CellKind.wall);
            const { rows, cols, cells, start, goal } = api();
            api().resize(otherSize);
            expect(api()).toMatchObject({ cellSize: otherSize, rows, cols, cells, start, goal });
        });

        it('bumps gridVersion so a finished run repaints at the new size', () => {
            const version = api().gridVersion;
            api().resize(otherSize);
            expect(api().gridVersion).toBe(version + 1);
        });

        it('is a no-op for the current size', () => {
            const version = api().gridVersion;
            api().resize(api().cellSize);
            expect(api().gridVersion).toBe(version);
        });

        it('clamps to MIN_CELL..MAX_CELL', () => {
            api().resize(MIN_CELL - 1);
            expect(api().cellSize).toBe(MIN_CELL);
            api().resize(MAX_CELL + 1);
            expect(api().cellSize).toBe(MAX_CELL);
        });

        it('is a no-op for a size that clamps to the current one', () => {
            api().resize(MIN_CELL);
            const version = api().gridVersion;
            api().resize(MIN_CELL - 1);
            expect(api().gridVersion).toBe(version);
        });
    });

    it('setGridLock toggles the lock', () => {
        api().setGridLock(true);
        expect(api().gridLock).toBe(true);
        api().setGridLock(false);
        expect(api().gridLock).toBe(false);
    });

    it('refresh bumps gridVersion', () => {
        const version = api().gridVersion;
        api().refresh();
        api().refresh();
        expect(api().gridVersion).toBe(version + 2);
    });
});
