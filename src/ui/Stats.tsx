// Authored by - Sarthak Kumar
//
// Stats: stats for algo runs like nodes visited, length of path etc (placeholder)

type Props = { className?: string };

export const Stats = ({ className = '' }: Props) => (
    <aside aria-label="Stats" className={className}>
        <h2 className="text-sm font-semibold">Stats</h2>
    </aside>
);
