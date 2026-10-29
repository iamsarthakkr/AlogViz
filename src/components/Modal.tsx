// Authored by - Sarthak Kumar
//
// Modal: generic daisyUI-styled <dialog> shell — a title, a close button (top right) and the content.
// Feature-agnostic: what goes inside is passed as children (see ui/InfoModal.tsx).
// - The parent's `open` prop is the truth: an effect calls showModal()/close() to follow it
//   (showModal, not the `open` attribute, so Esc, focus trapping and an inert page come for free;
//   guarded on dialog.open so Strict Mode's double effect doesn't open it twice)
// - When the browser closes it itself (Esc, the X or the backdrop, both <form method="dialog">), the
//   `close` event calls onModalClosed so the parent's state follows back

import { Callback } from '@/types/common';
import React from 'react';
import { CloseIcon } from '@/icons/CloseIcon';

type Props = {
    open: boolean;
    onModalClosed?: Callback;
    title: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
};

export const Modal = (props: Props) => {
    const { open, onModalClosed, title, children, className = '' } = props;
    const modalRef = React.useRef<HTMLDialogElement>(null);
    const titleId = React.useId();

    React.useEffect(() => {
        if (!modalRef.current) return;
        const modal = modalRef.current;
        if (open === modal.open) {
            return;
        }
        if (open) modal.showModal();
        else modal.close();
    }, [open]);

    const onClose = React.useCallback(() => {
        if (onModalClosed) {
            onModalClosed();
        }
    }, [onModalClosed]);

    return (
        <dialog ref={modalRef} className="d-modal" aria-labelledby={titleId} onClose={onClose}>
            <div className={`d-modal-box relative ${className}`}>
                <form method="dialog" className="absolute right-3 top-3">
                    <button
                        aria-label="Close"
                        className="size-9 rounded-full grid place-items-center text-primary/70 hover:bg-primary/10 hover:text-primary"
                    >
                        <CloseIcon />
                    </button>
                </form>
                <h2 id={titleId} className="pr-10 text-xl font-semibold text-primary">
                    {title}
                </h2>
                {children}
            </div>
            {/* click-outside-to-close; hidden from keyboard and screen readers (the X button is the real one) */}
            <form method="dialog" className="d-modal-backdrop" aria-hidden="true">
                <button tabIndex={-1}>close</button>
            </form>
        </dialog>
    );
};
