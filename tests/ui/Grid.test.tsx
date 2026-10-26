import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from '@/ui/Grid';
import { useGridStore } from '@/features/store';
import { lightPalette } from '@/features/painters';
import { MockCtx } from '../helpers/canvas';
import { installFakeRaf } from '../helpers/raf';

const callOrder = (fn: unknown) => vi.mocked(fn as () => void).mock.invocationCallOrder;

// What is visible on the overlay now: the path cells painted since it was last cleared
// (a clearRect, or a canvas resize, which tests/setup.ts records as one)
function pathOnScreen(overlay: MockCtx) {
    const lastClear = Math.max(0, ...callOrder(overlay.clearRect));
    const fillOrder = callOrder(overlay.fillRect);
    return overlay.fills.filter((f, i) => f.style === lightPalette.pathCell && fillOrder[i] > lastClear);
}

// default grid has no walls, so the path is a straight line along the middle row
function expectedPathLength() {
    const { start, goal } = useGridStore.getState();
    return Math.abs(goal.c - start.c) + 1;
}

describe('Grid page', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
    });

    const renderAndVisualize = async () => {
        const { container } = render(<Grid />);
        const overlay = container.querySelectorAll('canvas')[1].getContext('2d') as unknown as MockCtx;

        await userEvent.click(screen.getByRole('button', { name: 'Visualize' }));
        act(() => void raf.flush());
        return overlay;
    };

    // End to end: Visualize runs the default algorithm and traces the path on the overlay
    it('visualizes a path from start to goal on the overlay canvas', async () => {
        const overlay = await renderAndVisualize();
        expect(pathOnScreen(overlay)).toHaveLength(expectedPathLength());
    });

    // Resizing wipes the canvas and the run is re-solved at the new size; the repaint must come
    // after every clear (canvas resize, overlay clear), or the finished path vanishes
    it('keeps a finished path on screen after the grid is resized', async () => {
        const overlay = await renderAndVisualize();

        act(() => useGridStore.getState().resize(useGridStore.getState().cellSize + 1));
        act(() => void raf.flush());

        expect(pathOnScreen(overlay)).toHaveLength(expectedPathLength());
    });
});
