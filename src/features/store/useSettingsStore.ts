// Authored by - Sarthak Kumar
//
// useSettingsStore: UI/session state, separate from grid data.
// - Selected algorithm/maze keys, speed preset, settings-modal draft fields
// - Mostly cosmetic bookkeeping for dropdown labels; runner speed lives in useAlgoController

import { create } from 'zustand';
import { SettingsState } from '@/types/settings';
import { algoLabels } from '@/features/algo';

export const useSettingsStore = create<SettingsState>((set) => {
    return {
        algoKey: algoLabels[0], // default to BFS
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
