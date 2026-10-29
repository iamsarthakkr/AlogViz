// Authored by - Sarthak Kumar
//
// InfoIcon: an "i" in a circle. Decorative (aria-hidden): the button around it carries the name.
// Drawn in currentColor, so the parent's text colour sets it.

type Props = { className?: string };

export const InfoIcon = ({ className = 'size-6' }: Props) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4m0-4h.01" />
        </g>
    </svg>
);
