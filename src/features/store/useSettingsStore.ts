// Authored by - Sarthak Kumar
//
// useSettingsStore: UI/session state, separate from grid data.
// - The user's selections: algorithm key and speed preset. This is the only copy: the dropdowns
//   write here, and useAlgoController reads from here (the speed live, the algorithm when a run starts)

import { create } from 'zustand';
import { SettingsState } from '@/types/settings';
import { algoLabels } from '@/features/algo';

export const useSettingsStore = create<SettingsState>((set) => {
    return {
        algoKey: algoLabels[0],
        speed: 'medium',

        setAlgoKey: (algoKey) => set({ algoKey }),
        setSpeed: (speed) => set({ speed }),
    };
});
