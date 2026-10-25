import { describe, expect, it } from 'vitest';
import { useSettingsStore } from '@/features/store';
import { algoLabels } from '@/features/algo';

const api = () => useSettingsStore.getState();

describe('useSettingsStore', () => {
    it('has sensible defaults', () => {
        expect(api()).toMatchObject({
            algoKey: algoLabels[0],
            speed: 'medium',
            mazeGeneratorKey: '',
        });
    });

    it('stores the selected algorithm, maze and speed', () => {
        api().setAlgoKey('Depth-first search');
        api().setMazeGeneratorKey("Prim's");
        api().setSpeed('fast');
        expect(api()).toMatchObject({ algoKey: 'Depth-first search', mazeGeneratorKey: "Prim's", speed: 'fast' });
    });
});
