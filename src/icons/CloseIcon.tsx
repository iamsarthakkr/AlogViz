// Authored by - Sarthak Kumar
//
// CloseIcon: an "X". Decorative (aria-hidden): the button around it carries the name.
// Drawn in currentColor, so the parent's text colour sets it.

type Props = { className?: string };

export const CloseIcon = ({ className = 'size-5' }: Props) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
