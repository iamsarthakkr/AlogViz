import { describe, expect, it } from 'vitest';
import { availableSpeeds, speedToEPS } from '@/utils/settings';

describe('speed presets', () => {
    it('has an events-per-second rate for every selectable preset', () => {
        for (const preset of availableSpeeds) expect(speedToEPS[preset]).toBeGreaterThan(0);
    });

    it('gets faster from slow to fast', () => {
        expect(speedToEPS.slow).toBeLessThan(speedToEPS.medium);
        expect(speedToEPS.medium).toBeLessThan(speedToEPS.fast);
    });
});
