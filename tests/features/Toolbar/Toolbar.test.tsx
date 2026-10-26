import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar } from '@/features/Toolbar';
import { fakeAlgoController, fakeMazeGenerator } from '../../helpers/controllers';

describe('Toolbar', () => {
    it('renders the title with the pickers and the playback controls', () => {
        render(<Toolbar algo={fakeAlgoController()} maze={fakeMazeGenerator()} />);
        expect(screen.getByText('AlgoViz')).toBeInTheDocument();
        for (const name of ['Mazes & Patterns', 'Visualize', 'Step', 'Clear path', /Speed:/])
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
});
