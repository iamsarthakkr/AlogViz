export type SpeedPreset = 'slow' | 'medium' | 'fast';
export type SettingsState = {
    algoKey: string;
    speed: SpeedPreset;

    // actions
    setAlgoKey: (k: string) => void;
    setSpeed: (s: SpeedPreset) => void;
};
