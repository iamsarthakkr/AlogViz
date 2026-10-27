// Authored by - Sarthak Kumar
//
// Legend: what each colour on the grid means, plus how to edit it (placeholder)

import React from 'react';
import { useCanvasLayer } from '@/components/useCanvasLayer';
import { drawGoalMarker, drawStartMarker, lightPalette as palette } from '@/features/painters';

const SIZE = 24;
const at = { r: 0, c: 0 };
const fill = (color: string) => (ctx: CanvasRenderingContext2D, s: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
};

type LegendItemProps = {
    draw: (ctx: CanvasRenderingContext2D, size: number) => void;
};

const ITEMS: { label: string; draw: LegendItemProps['draw'] }[] = [
    { label: 'Start', draw: (ctx, s) => drawStartMarker(ctx, at, s) },
    { label: 'Goal', draw: (ctx, s) => drawGoalMarker(ctx, at, s) },
    { label: 'Wall', draw: fill(palette.cellWall) },
    { label: 'Frontier', draw: fill(palette.frontier) },
    {
        label: 'Visited',
        draw: (ctx, s) => {
            fill(palette.frontier)(ctx, s);
            fill(palette.visited)(ctx, s);
        },
    },
    { label: 'Path', draw: fill(palette.pathCell) },
];

const LegendItem = ({ draw }: LegendItemProps) => {
    const { ref, getCtx } = useCanvasLayer(1, 1, SIZE);

    React.useEffect(() => {
        const ctx = getCtx();
        if (!ctx) return;

        fill(palette.cellEmpty)(ctx, SIZE);
        draw(ctx, SIZE);
        return () => ctx.clearRect(0, 0, SIZE, SIZE);
    }, [getCtx, draw]);

    return (
        <canvas
            ref={ref}
            aria-hidden="true"
            className="shrink-0 border"
            style={{
                borderColor: palette.gridLine,
            }}
        />
    );
};

type Props = { className?: string };

export const Legend = ({ className = '' }: Props) => (
    <aside aria-label="Legend" className={`${className} text-sm flex xl:flex-col items-center justify-center`}>
        <h2 className="hidden xl:block xl:text-lg font-semibold mb-2">Legend</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 xl:flex-col xl:gap-2">
            {ITEMS.map(({ label, draw }) => (
                <li key={label} className="flex items-center gap-2">
                    <LegendItem draw={draw} />
                    <span className="xl:text-lg">{label}</span>
                </li>
            ))}
        </ul>
    </aside>
);
