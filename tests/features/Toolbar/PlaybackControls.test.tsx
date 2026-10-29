import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AlgoController } from '@/features/animations';
import { PlaybackControls } from '@/features/Toolbar/PlaybackControls';
import { useSettingsStore } from '@/features/store';
import { AlgoStatus } from '@/types/algo';
import { fakeAlgoController } from '../../helpers/controllers';

const button = (name: string | RegExp) => screen.getByRole('button', { name });

describe('PlaybackControls', () => {
    const setup = (algo: AlgoController = fakeAlgoController()) => {
        render(<PlaybackControls algo={algo} />);
        return { algo, user: userEvent.setup() };
    };

    // undefined = idle (no run yet); initial = a fresh run, ready to play
    describe.each([undefined, AlgoStatus.initial, AlgoStatus.paused, AlgoStatus.done])(
        'when status is %s',
        (status) => {
            it('offers Visualize, Step and Clear path', () => {
                setup(fakeAlgoController({ status }));
                expect(button('Visualize')).toBeEnabled();
                expect(button('Step')).toBeInTheDocument();
                expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
                expect(button('Clear path')).toBeEnabled();
            });
        },
    );

    describe('when running', () => {
        it('swaps Step for Pause and disables Visualize and Clear path', () => {
            setup(fakeAlgoController({ status: AlgoStatus.running }));
            expect(button('Pause')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Step' })).not.toBeInTheDocument();
            expect(button('Visualize')).toBeDisabled();
            expect(button('Clear path')).toBeDisabled();
        });

        it('pauses the controller', async () => {
            const { algo, user } = setup(fakeAlgoController({ status: AlgoStatus.running }));
            await user.click(button('Pause'));
            expect(algo.pause).toHaveBeenCalledOnce();
        });
    });

    it.each([
        ['Visualize', 'play'],
        ['Step', 'step'],
        ['Clear path', 'clear'],
    ] as const)('%s calls the controller’s %s', async (name, method) => {
        const { algo, user } = setup();
        await user.click(button(name));
        expect(algo[method]).toHaveBeenCalledOnce();
    });

    it('shows the speed preset from the settings store', () => {
        setup();
        expect(button(`Speed: ${useSettingsStore.getState().speed}`)).toBeInTheDocument();
    });

    // the controller reads the preset from the store, so the store is the only thing written
    it('changes the speed preset in the store', async () => {
        const { user } = setup();
        await user.click(within(button(/Speed:/).parentElement!).getByText('fast'));

        expect(useSettingsStore.getState().speed).toBe('fast');
        expect(button('Speed: fast')).toBeInTheDocument();
    });
});
