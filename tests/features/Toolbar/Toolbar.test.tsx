import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '@/features/Toolbar';
import { useSettingsStore } from '@/features/store';
import { fakeAlgoController, fakeMazeGenerator } from '../../helpers/controllers';

describe('Toolbar', () => {
    const setup = () => {
        const toggleModal = vi.fn();
        render(<Toolbar algo={fakeAlgoController()} maze={fakeMazeGenerator()} toggleModal={toggleModal} />);
        return { toggleModal };
    };
    const infoButton = () => screen.getByRole('button', { name: 'About AlgoViz' });

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

    describe('info button', () => {
        it('opens the info dialog', async () => {
            const { toggleModal } = setup();
            await userEvent.click(infoButton());
            expect(toggleModal).toHaveBeenCalledOnce();
        });

        // the icon is decorative, so the name must come from the button itself
        it('is named for screen readers and says it opens a dialog', () => {
            setup();
            expect(infoButton()).toHaveAttribute('aria-haspopup', 'dialog');
        });

        it('sits right after the title, before the pickers', () => {
            setup();
            const algoPicker = screen.getByRole('button', { name: useSettingsStore.getState().algoKey });
            const title = screen.getByText('AlgoViz');
            expect(title.compareDocumentPosition(infoButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(infoButton().compareDocumentPosition(algoPicker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });
    });
});
