import { AlgoEvent } from '../algo/types';
import { Coord } from '../types';
import { lightPalette as palette } from './colors';

export function clearOverlay(ctx: CanvasRenderingContext2D, rows: number, cols: number, s: number) {
    ctx.clearRect(0, 0, cols * s, rows * s);
}

function fillCell(ctx: CanvasRenderingContext2D, r: number, c: number, s: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(c * s, r * s, s, s);
}

export function paintAlgoEvent(
    ctx: CanvasRenderingContext2D,
    cellSize: number,
    e: AlgoEvent,
    opts?: { start?: Coord; goal?: Coord; drawPathInstant?: boolean },
) {
    switch (e.type) {
        case 'enqueue':
            fillCell(ctx, e.at.r, e.at.c, cellSize, palette.frontier);
            break;
        case 'visit':
            fillCell(ctx, e.at.r, e.at.c, cellSize, palette.visited);
            break;
        case 'path':
            if (opts?.drawPathInstant) drawPathPolyline(ctx, e.nodes, cellSize);
            break;
    }

    // keep markers visible if provided
    if (opts?.start) drawMarker(ctx, opts.start, cellSize, palette.start);
    if (opts?.goal) drawMarker(ctx, opts.goal, cellSize, palette.goal);
}

function drawPathPolyline(ctx: CanvasRenderingContext2D, nodes: Coord[], s: number) {
    if (!nodes.length) return;
    ctx.strokeStyle = palette.pathStroke;
    ctx.lineWidth = Math.max(2, s * 0.25);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const center = (p: Coord) => [p.c * s + s / 2, p.r * s + s / 2] as const;

    ctx.beginPath();
    const [x0, y0] = center(nodes[0]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < nodes.length; i++) {
        const [x, y] = center(nodes[i]);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawMarker(ctx: CanvasRenderingContext2D, p: Coord, s: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.c * s + s / 2, p.r * s + s / 2, Math.max(4, s * 0.35), 0, Math.PI * 2);
    ctx.fill();
}
