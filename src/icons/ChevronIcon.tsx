// Authored by - Sarthak Kumar
//
// ChevronIcon: a "<", ">" or "v" arrow. Decorative (aria-hidden): the button around it carries the name.
// Drawn in currentColor, so the parent's text colour sets it.

type Dir = 'left' | 'right' | 'down';
type Props = { dir: Dir; className?: string };

const PATHS: Record<Dir, string> = {
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    down: 'M19 9l-7 7-7-7',
};

export const ChevronIcon = ({ dir, className = 'size-5' }: Props) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
            d={PATHS[dir]}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
