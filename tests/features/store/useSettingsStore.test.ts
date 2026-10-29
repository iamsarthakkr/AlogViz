import { describe, expect, it } from 'vitest';
import { useSettingsStore } from '@/features/store';
import { algoLabels } from '@/features/algo';

const api = () => useSettingsStore.getState();

describe('useSettingsStore', () => {
    it('has sensible defaults', () => {
        expect(api()).toMatchObject({
            algoKey: algoLabels[0],
            speed: 'medium',
        });
    });

    it('stores the selected algorithm and speed', () => {
        api().setAlgoKey(algoLabels[1]);
        api().setSpeed('fast');
        expect(api()).toMatchObject({ algoKey: algoLabels[1], speed: 'fast' });
    });
});
