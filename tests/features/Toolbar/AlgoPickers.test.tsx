import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlgoPickers } from '@/features/Toolbar/AlgoPickers';
import { useSettingsStore } from '@/features/store';
import { algoLabels } from '@/features/algo';
import { mazesLabels } from '@/features/mazes';
import { fakeAlgoController, fakeMazeGenerator } from '../../helpers/controllers';

const dropdown = (title: string) => screen.getByRole('button', { name: title }).parentElement!;

describe('AlgoPickers', () => {
    const setup = () => {
        const algo = fakeAlgoController();
        const maze = fakeMazeGenerator();
        render(<AlgoPickers algo={algo} maze={maze} />);
        return { algo, maze, user: userEvent.setup() };
    };

    it('shows the selected algorithm and the maze menu', () => {
        setup();
        expect(screen.getByRole('button', { name: useSettingsStore.getState().algoKey })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mazes & Patterns' })).toBeInTheDocument();
    });

    it('switches the algorithm in the store and the controller', async () => {
        const { algo, user } = setup();
        const next = algoLabels[1];
        await user.click(within(dropdown(algoLabels[0])).getByText(next));

        expect(useSettingsStore.getState().algoKey).toBe(next);
        expect(algo.setAlgorithm).toHaveBeenCalledWith(next);
        expect(screen.getByRole('button', { name: next })).toBeInTheDocument();
    });

    // the old path must be cleared before the maze starts writing walls under it
    it('clears the current path, then generates the chosen maze', async () => {
        const { algo, maze, user } = setup();
        const key = mazesLabels[0];
        await user.click(within(dropdown('Mazes & Patterns')).getByText(key));

        expect(maze.generate).toHaveBeenCalledWith(key);
        const [cleared] = vi.mocked(algo.clear).mock.invocationCallOrder;
        const [generated] = vi.mocked(maze.generate).mock.invocationCallOrder;
        expect(cleared).toBeLessThan(generated);
        expect(useSettingsStore.getState().mazeGeneratorKey).toBe(key);
    });
});
