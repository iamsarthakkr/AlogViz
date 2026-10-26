// Authored by - Sarthak Kumar
//
// Legend: what each colour on the grid means, plus how to edit it (placeholder)

type Props = { className?: string };

export const Legend = ({ className = '' }: Props) => (
    <aside aria-label="Legend" className={className}>
        <h2 className="text-sm font-semibold">Legend</h2>
    </aside>
);
