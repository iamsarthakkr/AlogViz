import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMazeGenerator } from '@/features/animations/useMazeGenerator';
import { useGridStore } from '@/features/store';
import { CellKind } from '@/types/grid';
import { MazeGenerator } from '@/types/mazeGenerator';
import { installFakeRaf } from '../../helpers/raf';

// Deterministic generator exercising every event type
const scripted: MazeGenerator = function* () {
    yield { type: 'fill-wall' };
    yield { type: 'carve', at: { r: 1, c: 1 } };
    yield { type: 'clear-wall' };
    yield { type: 'wall', at: { r: 0, c: 0 } };
    yield { type: 'wall', at: { r: 0, c: 1 } };
    yield { type: 'done' };
};

const api = () => useGridStore.getState();

describe('useMazeGenerator', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
        api().setDimensions(5, 5);
        api().setStart(2, 1);
        api().setGoal(2, 3);
    });

    const render = () => renderHook(() => useMazeGenerator({ scripted }, { speed: 60 }));

    it('locks the grid and hides the markers while generating', () => {
        const { result } = render();
        act(() => result.current.generate('scripted'));
        expect(api().gridLock).toBe(true);
        expect(api().validStart()).toBe(false);
        expect(api().validGoal()).toBe(false);
    });

    it('writes each event into the grid store', () => {
        const { result } = render();
        act(() => result.current.generate('scripted'));
        raf.frame(); // fill-wall
        expect(api().cells.every((k) => k === CellKind.wall)).toBe(true);
        raf.frame(); // carve
        expect(api().at(1, 1)).toBe(CellKind.empty);
        raf.frame(); // clear-wall
        raf.frame(); // wall
        raf.frame(); // wall
        expect(api().at(0, 0)).toBe(CellKind.wall);
        expect(api().at(0, 1)).toBe(CellKind.wall);
        expect(api().at(4, 4)).toBe(CellKind.empty);
    });

    it('restores the markers, unlocks and bumps gridVersion when done', () => {
        const { result } = render();
        const version = api().gridVersion;
        act(() => result.current.generate('scripted'));
        raf.flush();
        expect(api().start).toEqual({ r: 2, c: 1 });
        expect(api().goal).toEqual({ r: 2, c: 3 });
        expect(api().gridLock).toBe(false);
        expect(api().gridVersion).toBe(version + 1);
    });

    it('starting a new maze mid-run cancels the old one and restores markers first', () => {
        const { result } = render();
        act(() => result.current.generate('scripted'));
        raf.frame();
        act(() => result.current.generate('scripted'));
        raf.flush();
        expect(api().start).toEqual({ r: 2, c: 1 });
        expect(api().goal).toEqual({ r: 2, c: 3 });
        expect(api().gridLock).toBe(false);
    });

    it('ignores unknown generator keys', () => {
        const { result } = render();
        act(() => result.current.generate('missing'));
        expect(api().gridLock).toBe(false);
        expect(raf.pending()).toBe(0);
    });

    it('does nothing while a marker is hidden', () => {
        api().setGoal(-1, -1);
        const { result } = render();
        act(() => result.current.generate('scripted'));
        expect(api().gridLock).toBe(false);
    });
});
