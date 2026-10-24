import { describe, expect, it } from 'vitest';
import { getGridSnapshot } from '@/features/animations/utils';
import { useGridStore } from '@/features/store';
import { CellKind } from '@/types/grid';

describe('getGridSnapshot', () => {
    it('returns a copy of the grid', () => {
        const snap = getGridSnapshot()!;
        const state = useGridStore.getState();
        expect(snap).toEqual({
            gridVersion: state.gridVersion,
            rows: state.rows,
            cols: state.cols,
            cellSize: state.cellSize,
            cells: state.cells,
            start: state.start,
            goal: state.goal,
            gridLock: state.gridLock,
        });
    });

    // An algorithm run must not see edits made while it's animating
    it('is detached from later store updates', () => {
        const snap = getGridSnapshot()!;
        useGridStore.getState().setCell(0, 0, CellKind.wall);
        useGridStore.getState().setStart(0, 3);
        expect(snap.cells[0]).toBe(CellKind.empty);
        expect(snap.start).not.toEqual({ r: 0, c: 3 });
    });

    it('returns null while start or goal is hidden (e.g. during maze generation)', () => {
        useGridStore.getState().setStart(-1, -1);
        expect(getGridSnapshot()).toBeNull();
        useGridStore.getState().reset();
        useGridStore.getState().setGoal(-1, -1);
        expect(getGridSnapshot()).toBeNull();
    });
});
