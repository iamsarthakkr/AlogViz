// Authored by - Sarthak Kumar
//
// getGridSnapshot: freezes a plain-data copy of the current grid for an algorithm run.
// Returns null if start/goal aren't valid, which is what silently no-ops Visualize/Step.

import { GridSnapShot } from '@/types/grid';
import { useGridStore } from '@features/store';

export const getGridSnapshot = (): GridSnapShot | null => {
    const state = useGridStore.getState();
    if (!state.validStart() || !state.validGoal()) return null;

    return {
        gridVersion: state.gridVersion,
        rows: state.rows,
        cols: state.cols,
        cells: state.cells.slice(),
        start: { ...state.start },
        goal: { ...state.goal },
        cellSize: state.cellSize,
        gridLock: state.gridLock,
    };
};
