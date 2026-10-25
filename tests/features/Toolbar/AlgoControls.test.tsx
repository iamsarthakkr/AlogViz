import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Toolbar } from '@/features/Toolbar';
import { CanvasGrid, CanvasGridHandle } from '@/features/CanvasGrid';
import { useGridStore, useSettingsStore } from '@/features/store';
import { installFakeRaf } from '../../helpers/raf';
import { seedRandom } from '../../helpers/random';
import { algoLabels } from '@/features/algo';

describe('Toolbar / AlgoControls', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
    });

    const setup = () => {
        const ref = createRef<CanvasGridHandle>();
        render(
            <>
                <Toolbar ctx={ref} className="mb-5" />
                <CanvasGrid ref={ref} />
            </>,
        );
        return { user: userEvent.setup() };
    };

    const dropdown = (title: RegExp | string) => screen.getByRole('button', { name: title }).parentElement!;

    it('renders the title and controls', () => {
        setup();
        expect(screen.getByText('AlgoViz')).toBeInTheDocument();
        for (const name of ['Visualize', 'Step', 'Clear path', algoLabels[0], 'Mazes & Patterns', /Speed: medium/])
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });

    it('shows the chosen algorithm in its dropdown', async () => {
        const { user } = setup();
        await user.click(within(dropdown(algoLabels[0])).getByText('Depth-first search'));
        expect(screen.getByRole('button', { name: 'Depth-first search' })).toBeInTheDocument();
        expect(useSettingsStore.getState().algoKey).toBe('Depth-first search');
    });

    it('swaps Step for Pause while running and disables Visualize / Clear path', async () => {
        const { user } = setup();
        await user.click(screen.getByRole('button', { name: 'Visualize' }));
        expect(screen.getByRole('button', { name: 'Visualize' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Clear path' })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Pause' }));
        expect(screen.getByRole('button', { name: 'Step' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Visualize' })).toBeEnabled();
    });

    it('re-enables everything once the run finishes', async () => {
        const { user } = setup();
        await user.click(screen.getByRole('button', { name: 'Visualize' }));
        act(() => void raf.flush());
        expect(screen.getByRole('button', { name: 'Visualize' })).toBeEnabled();
        expect(useGridStore.getState().gridLock).toBe(false);
    });

    it('changes the speed preset', async () => {
        const { user } = setup();
        await user.click(within(dropdown(/Speed:/)).getByText('fast'));
        expect(screen.getByRole('button', { name: 'Speed: fast' })).toBeInTheDocument();
        expect(useSettingsStore.getState().speed).toBe('fast');
    });

    it('generates a maze into the grid', async () => {
        seedRandom(3);
        const { user } = setup();
        await user.click(within(dropdown('Mazes & Patterns')).getByText('Recursive Division'));
        expect(useSettingsStore.getState().mazeGeneratorKey).toBe('Recursive Division');
        expect(useGridStore.getState().gridLock).toBe(true);

        act(() => void raf.flush());
        const { cells, gridLock, validStart, validGoal } = useGridStore.getState();
        expect(gridLock).toBe(false);
        expect(cells.some((k) => k === 1)).toBe(true);
        expect(validStart() && validGoal()).toBe(true);
    });
});
