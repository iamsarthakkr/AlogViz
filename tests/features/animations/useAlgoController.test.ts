import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAlgoController } from '@/features/animations';
import type { CanvasGridHandle } from '@/features/CanvasGrid';
import { useGridStore } from '@/features/store';
import { bfs } from '@/features/algo/bfs';
import { dfs } from '@/features/algo/dfs';
import { lightPalette } from '@/features/painters';
import { CellKind } from '@/types/grid';
import { createMockCtx, MockCtx } from '../../helpers/canvas';
import { installFakeRaf } from '../../helpers/raf';

const registry = { BFS: bfs, DFS: dfs };

// 5x5 open grid, start (2,0) → goal (2,4): shortest path is 5 cells
function setupGrid() {
    const api = useGridStore.getState();
    api.setDimensions(5, 5);
    api.setStart(2, 0);
    api.setGoal(2, 4);
}

describe('useAlgoController', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    let overlay: MockCtx;
    let gridRef: { current: CanvasGridHandle };

    beforeEach(() => {
        raf = installFakeRaf();
        setupGrid();
        overlay = createMockCtx();
        gridRef = {
            current: {
                getBaseCtx: () => null,
                getOverlayCtx: () => overlay,
                clearOverlay: vi.fn(),
                redrawBase: vi.fn(),
            },
        };
    });

    const render = (opts?: Parameters<typeof useAlgoController>[2]) =>
        renderHook(() => useAlgoController(gridRef, registry, opts));

    const flush = () => act(() => void raf.flush());
    const pathFills = () => overlay.fills.filter((f) => f.style === lightPalette.pathCell);

    it('starts idle on the first registered algorithm', () => {
        const { result } = render();
        expect(result.current.status).toBe('idle');
        expect(result.current.currentAlgo).toBe('BFS');
        expect(result.current.pathLen).toBeNull();
    });

    it('honours initialAlgo and initialSpeed, ignoring unknown keys', () => {
        expect(render({ initialAlgo: 'DFS', initialSpeed: 99 }).result.current).toMatchObject({
            currentAlgo: 'DFS',
            speed: 99,
        });
        expect(render({ initialAlgo: 'nope' }).result.current.currentAlgo).toBe('BFS');
    });

    it('play locks the grid, animates to completion, then unlocks and reports the path', () => {
        const { result } = render();
        act(() => result.current.play());
        expect(result.current.status).toBe('running');
        expect(useGridStore.getState().gridLock).toBe(true);

        flush();
        expect(result.current.status).toBe('done');
        expect(result.current.pathLen).toBe(5);
        expect(result.current.visitedApprox).toBeGreaterThan(0);
        expect(useGridStore.getState().gridLock).toBe(false);
        expect(pathFills()).toHaveLength(5);
    });

    // Strict Mode runs the unmount cleanup then remounts with the same refs; the cleanup used to
    // blank currentKeyRef, so Visualize did nothing until an algorithm was picked from the dropdown
    it('plays the default algorithm under Strict Mode without one being selected', () => {
        const { result } = renderHook(() => useAlgoController(gridRef, registry), { reactStrictMode: true });
        act(() => result.current.play());
        flush();
        expect(result.current.status).toBe('done');
        expect(result.current.pathLen).toBe(5);
    });

    it('pause stops the run and releases the grid lock', () => {
        const { result } = render();
        act(() => result.current.play());
        act(() => result.current.pause());
        expect(result.current.status).toBe('paused');
        expect(useGridStore.getState().gridLock).toBe(false);
    });

    it('step advances one event at a time until done', () => {
        const { result } = render();
        act(() => result.current.step());
        expect(result.current.status).toBe('paused');
        for (let i = 0; i < 100 && result.current.status !== 'done'; i++) act(() => result.current.step());
        expect(result.current.status).toBe('done');
        expect(result.current.pathLen).toBe(5);
    });

    it('skipToEnd finishes immediately', () => {
        const { result } = render();
        act(() => result.current.skipToEnd());
        expect(result.current.status).toBe('done');
        expect(result.current.pathLen).toBe(5);
        expect(useGridStore.getState().gridLock).toBe(false);
    });

    it('reports a path length of 0 when the goal is unreachable', () => {
        const api = useGridStore.getState();
        for (let r = 0; r < 5; r++) api.setCell(r, 2, CellKind.wall);
        const { result } = render();
        act(() => result.current.skipToEnd());
        expect(result.current.pathLen).toBe(0);
    });

    it('does nothing while start or goal is hidden', () => {
        useGridStore.getState().setStart(-1, -1);
        const { result } = render();
        act(() => result.current.play());
        expect(result.current.status).toBe('idle');
        expect(useGridStore.getState().gridLock).toBe(false);
    });

    it('setAlgorithm switches which algorithm runs next', () => {
        const { result } = render();
        act(() => result.current.setAlgorithm('DFS'));
        act(() => result.current.skipToEnd());
        expect(result.current.currentAlgo).toBe('DFS');
        // DFS hugs the top edge first on an open grid, so its path is longer than BFS's 5
        expect(result.current.pathLen).toBeGreaterThan(5);
    });

    it('setSpeed updates the reported speed (min 1)', () => {
        const { result } = render();
        act(() => result.current.setSpeed(600));
        expect(result.current.speed).toBe(600);
        act(() => result.current.setSpeed(0));
        expect(result.current.speed).toBe(1);
    });

    it('clear wipes the overlay and leaves a fresh runner ready', () => {
        const { result } = render();
        act(() => result.current.skipToEnd());
        act(() => result.current.clear());
        expect(gridRef.current.clearOverlay).toHaveBeenCalled();
        expect(result.current.status).toBe('ready');
        expect(result.current.pathLen).toBeNull();
    });

    it('play after a finished run starts a new run', () => {
        const { result } = render();
        act(() => result.current.skipToEnd());
        act(() => result.current.play());
        expect(result.current.status).toBe('running');
    });

    // Editing walls after a finished run re-solves instantly so the path stays in sync
    it('re-solves instantly when the grid changes after a finished run', () => {
        const { result } = render();
        act(() => result.current.skipToEnd());
        expect(result.current.pathLen).toBe(5);

        act(() => {
            useGridStore.getState().setCell(2, 2, CellKind.wall);
            useGridStore.getState().refresh();
        });
        expect(result.current.status).toBe('done');
        expect(result.current.pathLen).toBe(7);
    });

    it('rebuilds (without solving) when the grid changes mid-run', () => {
        const { result } = render();
        act(() => result.current.step());
        act(() => useGridStore.getState().refresh());
        expect(result.current.status).toBe('ready');
        expect(result.current.pathLen).toBeNull();
    });

    it('is a no-op for an algorithm that is not in the registry', () => {
        const { result } = render();
        act(() => result.current.setAlgorithm('missing'));
        act(() => result.current.play());
        expect(result.current.status).toBe('idle');
    });

    it('stops playback on unmount', () => {
        const { result, unmount } = render();
        act(() => result.current.play());
        const fillsBefore = overlay.fills.length;
        unmount();
        raf.flush();
        expect(overlay.fills.length).toBe(fillsBefore);
    });

    it('animatePath: false draws the path instantly', () => {
        const { result } = render({ animatePath: false });
        act(() => result.current.skipToEnd());
        expect(pathFills()).toHaveLength(5);
    });

    it('animates the path by default: nothing drawn until frames run', () => {
        const { result } = render();
        act(() => result.current.skipToEnd());
        expect(pathFills()).toHaveLength(0);
        flush();
        expect(pathFills()).toHaveLength(5);
    });
});
