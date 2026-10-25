export type SpeedPreset = 'slow' | 'medium' | 'fast';
export type SettingsState = {
    algoKey: string;
    speed: SpeedPreset;

    // maze generation
    mazeGeneratorKey: string;

    // actions
    setAlgoKey: (k: string) => void;
    setSpeed: (s: SpeedPreset) => void;

    setMazeGeneratorKey: (k: string) => void;
};
