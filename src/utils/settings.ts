// Authored by - Sarthak Kumar
//
// speedToEPS: maps a speed preset (slow/medium/fast) to a runner events-per-second rate.

import { SpeedPreset } from '@/types/settings';

export const speedToEPS: Record<SpeedPreset, number> = {
    slow: 80,
    medium: 220,
    fast: 600,
};

export const availableSpeeds: SpeedPreset[] = ['slow', 'medium', 'fast'];
