import { AlgoEvent } from '@/types/algo';
import { Coord } from '@/types/grid';
import { drawMarkers } from './basePainter';
import { lightPalette as palette } from './colors';
import { Callback } from '@/types/common';

export function clearOverlay(ctx: CanvasRenderingContext2D, rows: number, cols: number, s: number) {
    ctx.clearRect(0, 0, cols * s, rows * s);
}

function fillCell(ctx: CanvasRenderingContext2D, r: number, c: number, s: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(c * s, r * s, s, s);
}

/** single source of truth for "path cell" painting */
function fillPathCell(ctx: CanvasRenderingContext2D, cell: Coord, s: number) {
    fillCell(ctx, cell.r, cell.c, s, palette.pathCell);
}

/** draw the whole path instantly (cells) */
export function drawFinalPath(
    ctx: CanvasRenderingContext2D,
    nodes: Coord[],
    s: number,
    opts?: { skipEndpoints?: boolean },
) {
    if (!nodes.length) return;
    const startIdx = opts?.skipEndpoints ? 1 : 0;
    const endIdx = opts?.skipEndpoints ? nodes.length - 1 : nodes.length;
    for (let i = startIdx; i < endIdx; i++) {
        fillPathCell(ctx, nodes[i], s);
    }
}

/** animate by filling N cells per frame; returns cancel fn */
export function animateFinalPath(
    ctx: CanvasRenderingContext2D,
    nodes: Coord[],
    s: number,
    nps = 240,
    onFrame?: Callback,
) {
    if (!nodes.length) return () => { };
    let i = 0;
    let raf = 0;
    const perFrame = Math.max(1, Math.ceil(nps / 60));

    const step = () => {
        for (let k = 0; k < perFrame && i < nodes.length; k++, i++) {
            fillPathCell(ctx, nodes[i], s);
        }
        if (onFrame) onFrame();
        if (i < nodes.length) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
}

export function paintAlgoEvent(
    ctx: CanvasRenderingContext2D,
    cellSize: number,
    e: AlgoEvent,
    opts?: {
        start?: Coord;
        goal?: Coord;
        drawPathInstant?: boolean;
    },
) {
    switch (e.type) {
        case 'enqueue':
            fillCell(ctx, e.at.r, e.at.c, cellSize, palette.frontier);
            break;
        case 'visit':
            fillCell(ctx, e.at.r, e.at.c, cellSize, palette.visited);
            break;
        case 'path':
            if (opts?.drawPathInstant) drawFinalPath(ctx, e.nodes, cellSize);
            break;
    }

    if (opts?.start && opts?.goal) drawMarkers(ctx, opts.start, opts.goal, cellSize);
}
