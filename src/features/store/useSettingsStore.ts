// Authored by - Sarthak Kumar
//
// useSettingsStore: UI/session state, separate from grid data.
// - Selected algorithm/maze keys, speed preset
// - Mostly cosmetic bookkeeping for dropdown labels; runner speed lives in useAlgoController

import { create } from 'zustand';
import { SettingsState } from '@/types/settings';
import { algoLabels } from '@/features/algo';

export const useSettingsStore = create<SettingsState>((set) => {
    return {
        algoKey: algoLabels[0], // default to BFS
        speed: 'medium',

        mazeGeneratorKey: '',

        setAlgoKey: (algoKey) => set({ algoKey }),
        setSpeed: (speed) => set({ speed }),

        setMazeGeneratorKey: (mazeGeneratorKey) => set({ mazeGeneratorKey }),
    };
});
