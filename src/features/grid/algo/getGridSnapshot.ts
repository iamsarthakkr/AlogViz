import { useGridStore } from '../store/useGridStore';
import { GridSnapShot } from './types';

export const getGridShapshot = (): GridSnapShot => {
    const state = useGridStore.getState();
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
