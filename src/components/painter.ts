import { CellKind } from '@/features/grid/types';

type CellVisual = CellKind | 'visited' | 'visiting';

export const drawCell = (ctx: CanvasRenderingContext2D, r: number, c: number, s: number, kind: CellVisual) => {
    if (kind === 'wall') ctx.fillStyle = '#3c3f46';
    else if (kind === 'visiting')
        ctx.fillStyle = 'rgba(59,130,246,0.4)'; // blue-ish
    else if (kind === 'visited')
        ctx.fillStyle = 'rgba(234,179,8,0.4)'; // amber-ish
    else ctx.fillStyle = '#ffffff';
    ctx.fillRect(c * s, r * s, s, s);
};

export const drawGridLines = (ctx: CanvasRenderingContext2D, rows: number, cols: number, s: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let r = 0; r <= rows; r++) {
        const y = r * s + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cols * s, y);
        ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
        const x = c * s + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rows * s);
        ctx.stroke();
    }
};

export const drawMarkers = (
    ctx: CanvasRenderingContext2D,
    s: number,
    start: { r: number; c: number },
    goal: { r: number; c: number },
) => {
    const dot = (p: { r: number; c: number }, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.c * s + s / 2, p.r * s + s / 2, Math.max(4, s * 0.35), 0, Math.PI * 2);
        ctx.fill();
    };
    dot(start, '#10b981');
    dot(goal, '#ef4444');
};

export const drawAll = (
    ctx: CanvasRenderingContext2D,
    rows: number,
    cols: number,
    s: number,
    cells: CellKind[],
    start: { r: number; c: number },
    goal: { r: number; c: number },
) => {
    ctx.clearRect(0, 0, cols * s, rows * s);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            drawCell(ctx, r, c, s, cells[r * cols + c]);
        }
    }
    drawGridLines(ctx, rows, cols, s);
    drawMarkers(ctx, s, start, goal);
};
