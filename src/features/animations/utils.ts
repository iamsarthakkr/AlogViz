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
    };
};
