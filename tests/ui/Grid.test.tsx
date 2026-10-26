import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from '@/ui/Grid';
import { useGridStore } from '@/features/store';
import { lightPalette } from '@/features/painters';
import { mazesLabels } from '@/features/mazes';
import { CellKind } from '@/types/grid';
import { MockCtx } from '../helpers/canvas';
import { installFakeRaf } from '../helpers/raf';
import { seedRandom } from '../helpers/random';

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

    // The toolbar and the canvas share the one controller the page owns
    describe('controls driving the real controller', () => {
        const button = (name: string) => screen.getByRole('button', { name });

        it('locks the grid while running, then unlocks and re-enables the controls when done', async () => {
            render(<Grid />);
            const user = userEvent.setup();

            await user.click(button('Visualize'));
            expect(button('Visualize')).toBeDisabled();
            expect(button('Pause')).toBeInTheDocument();
            expect(useGridStore.getState().gridLock).toBe(true);

            act(() => void raf.flush());
            expect(button('Visualize')).toBeEnabled();
            expect(button('Step')).toBeInTheDocument();
            expect(useGridStore.getState().gridLock).toBe(false);
        });

        it('pausing a run gives the Step button back and unlocks the grid', async () => {
            render(<Grid />);
            const user = userEvent.setup();

            await user.click(button('Visualize'));
            await user.click(button('Pause'));
            expect(button('Step')).toBeInTheDocument();
            expect(button('Visualize')).toBeEnabled();
            expect(useGridStore.getState().gridLock).toBe(false);
        });

        it('generates a maze into the grid', async () => {
            seedRandom(3);
            render(<Grid />);
            const user = userEvent.setup();
            const maze = mazesLabels[0];

            await user.click(within(button('Mazes & Patterns').parentElement!).getByText(maze));
            expect(useGridStore.getState().gridLock).toBe(true);

            act(() => void raf.flush());
            const { cells, gridLock, validStart, validGoal } = useGridStore.getState();
            expect(gridLock).toBe(false);
            expect(cells).toContain(CellKind.wall);
            expect(validStart() && validGoal()).toBe(true);
        });
    });
});
