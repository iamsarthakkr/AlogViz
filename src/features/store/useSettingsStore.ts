import { create } from 'zustand';
import { SettingsState } from '@/types/settings';

export const useSettingsStore = create<SettingsState>((set) => {
    return {
        algoKey: 'bfs',
        speed: 'medium',

        isSettingsOpen: false,

        rowsDraft: 20,
        colsDraft: 40,
        cellSizeDraft: 22,

        mazeGeneratorKey: '',

        setAlgoKey: (algoKey) => set({ algoKey }),

        setSpeed: (speed) => set({ speed }),

        openSettings: (rows, cols, cellSize) =>
            set({ rowsDraft: rows, colsDraft: cols, cellSizeDraft: cellSize, isSettingsOpen: true }),
        closeSettings: () => set({ isSettingsOpen: false }),
        setDraftRows: (v) => set({ rowsDraft: v }),
        setDraftCols: (v) => set({ colsDraft: v }),
        setDraftCell: (v) => set({ cellSizeDraft: v }),

        setMazeGeneratorKey: (mazeGeneratorKey) => set({ mazeGeneratorKey }),
    };
});
