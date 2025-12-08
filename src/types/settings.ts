export type SpeedPreset = 'slow' | 'medium' | 'fast';
export type SettingsState = {
    algoKey: string;
    speed: SpeedPreset;
    isSettingsOpen: boolean;

    // settings modal drafts
    rowsDraft: number;
    colsDraft: number;
    cellSizeDraft: number;

    // maze generation
    mazeGeneratorKey: string;

    // actions
    setAlgoKey: (k: string) => void;
    setSpeed: (s: SpeedPreset) => void;

    openSettings: (rows: number, cols: number, cellSize: number) => void;
    closeSettings: () => void;
    setDraftRows: (v: number) => void;
    setDraftCols: (v: number) => void;
    setDraftCell: (v: number) => void;

    setMazeGeneratorKey: (k: string) => void;
};
