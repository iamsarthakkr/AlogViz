import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/Modal';

// The parent's `open` state is the truth; the native <dialog> follows it, and when the browser
// closes it (X, Esc, backdrop) the `close` event tells the parent
describe('Modal', () => {
    const dialog = () => screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement;

    it('opens and closes with the open prop', () => {
        const { rerender } = render(<Modal open={false} title="T" />);
        expect(dialog().open).toBe(false);
        rerender(<Modal open title="T" />);
        expect(dialog().open).toBe(true);
        rerender(<Modal open={false} title="T" />);
        expect(dialog().open).toBe(false);
    });

    it('is named by its title and shows its content', () => {
        render(
            <Modal open title="Hello">
                <p>body</p>
            </Modal>,
        );
        expect(screen.getByRole('dialog', { name: 'Hello' })).toHaveTextContent('body');
    });

    it('reports a close by the browser (Esc, X, backdrop) to the parent', () => {
        const onModalClosed = vi.fn();
        render(<Modal open title="T" onModalClosed={onModalClosed} />);
        act(() => dialog().close()); // what the browser does on Esc or a <form method="dialog"> submit
        expect(onModalClosed).toHaveBeenCalledOnce();
    });

    // without onModalClosed the parent would still think it's open, and setOpen(true) would be a no-op
    it('can be reopened after the browser closed it', async () => {
        const Parent = () => {
            const [open, setOpen] = useState(true);
            return (
                <>
                    <button onClick={() => setOpen(true)}>open</button>
                    <Modal open={open} onModalClosed={() => setOpen(false)} title="T" />
                </>
            );
        };
        render(<Parent />);
        act(() => dialog().close());
        expect(dialog().open).toBe(false);

        await userEvent.click(screen.getByRole('button', { name: 'open' }));
        expect(dialog().open).toBe(true);
    });

    it('has one labelled close button for keyboard and screen readers', () => {
        render(<Modal open title="T" />);
        expect(screen.getAllByRole('button', { name: /close/i })).toHaveLength(1);
    });
});
