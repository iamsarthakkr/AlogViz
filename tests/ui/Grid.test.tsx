import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from '@/ui/Grid';
import { useGridStore } from '@/features/store';
import { lightPalette } from '@/features/painters';
import { MockCtx } from '../helpers/canvas';
import { installFakeRaf } from '../helpers/raf';

describe('Grid page', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
    });

    // End to end: Visualize runs the default algorithm and traces the path on the overlay
    it('visualizes a path from start to goal on the overlay canvas', async () => {
        const { container } = render(<Grid />);
        const overlay = container.querySelectorAll('canvas')[1].getContext('2d') as unknown as MockCtx;

        await userEvent.click(screen.getByRole('button', { name: 'Visualize' }));
        act(() => void raf.flush());

        const { start, goal } = useGridStore.getState();
        const pathCells = overlay.fills.filter((f) => f.style === lightPalette.pathCell);
        // default grid has no walls, so the path is a straight line along the middle row
        expect(pathCells).toHaveLength(Math.abs(goal.c - start.c) + 1);
    });
});
