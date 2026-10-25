import { describe, expect, it } from 'vitest';
import { useSettingsStore } from '@/features/store';
import { algoLabels } from '@/features/algo';

const api = () => useSettingsStore.getState();

describe('useSettingsStore', () => {
    it('has sensible defaults', () => {
        expect(api()).toMatchObject({
            algoKey: algoLabels[0],
            speed: 'medium',
            isSettingsOpen: false,
            mazeGeneratorKey: '',
        });
    });

    it('stores the selected algorithm, maze and speed', () => {
        api().setAlgoKey('Depth-first search');
        api().setMazeGeneratorKey("Prim's");
        api().setSpeed('fast');
        expect(api()).toMatchObject({ algoKey: 'Depth-first search', mazeGeneratorKey: "Prim's", speed: 'fast' });
    });

    it('openSettings seeds the drafts from the current grid', () => {
        api().openSettings(12, 34, 16);
        expect(api()).toMatchObject({ isSettingsOpen: true, rowsDraft: 12, colsDraft: 34, cellSizeDraft: 16 });
        api().closeSettings();
        expect(api().isSettingsOpen).toBe(false);
    });

    it('updates each draft independently', () => {
        api().setDraftRows(5);
        api().setDraftCols(6);
        api().setDraftCell(7);
        expect(api()).toMatchObject({ rowsDraft: 5, colsDraft: 6, cellSizeDraft: 7 });
    });
});
