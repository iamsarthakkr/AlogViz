// Authored by - Sarthak Kumar
//
// settings types: the speed presets and the shape of useSettingsStore (the user's selections).

export type SpeedPreset = 'slow' | 'medium' | 'fast';
export type SettingsState = {
    algoKey: string;
    speed: SpeedPreset;

    // actions
    setAlgoKey: (k: string) => void;
    setSpeed: (s: SpeedPreset) => void;
};
