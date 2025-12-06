import { SpeedPreset } from '@/types/settings';

export const speedToEPS: Record<SpeedPreset, number> = {
    slow: 80,
    medium: 220,
    fast: 600,
};
