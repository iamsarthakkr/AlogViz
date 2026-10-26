import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar } from '@/features/Toolbar';
import { useSettingsStore } from '@/features/store';
import { fakeAlgoController, fakeMazeGenerator } from '../../helpers/controllers';

describe('Toolbar', () => {
    const setup = () => render(<Toolbar algo={fakeAlgoController()} maze={fakeMazeGenerator()} />);

    it('is the page header, with the title and both pickers', () => {
        setup();
        const header = screen.getByRole('banner');
        expect(header).toHaveTextContent('AlgoViz');
        expect(screen.getByRole('button', { name: useSettingsStore.getState().algoKey })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mazes & Patterns' })).toBeInTheDocument();
    });

    // the page places the playback controls in their own grid area (top bar on desktop,
    // bottom bar on phones), so they must not be nested in the header
    it('does not contain the playback controls', () => {
        setup();
        for (const name of ['Visualize', 'Step', 'Clear path', /Speed:/])
            expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    });
});
