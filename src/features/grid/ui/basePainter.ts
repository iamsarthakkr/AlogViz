import type { Coord } from '@/features/grid/types';
import { lightPalette as palette } from './colors';

function center(p: Coord, s: number) {
    return [p.c * s + s / 2, p.r * s + s / 2] as const;
}

export function drawStartMarker(ctx: CanvasRenderingContext2D, p: Coord, s: number) {
    const size = Math.max(6, s * 0.5); // scale with cell size

    const [cx, cy] = center(p, s);
    ctx.strokeStyle = '#1e3a8a'; // dark blue
    ctx.lineWidth = Math.max(2, s * 0.15);
    ctx.lineCap = 'round';

    ctx.beginPath();
    // upper line
    ctx.moveTo(cx - size * 0.4, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.4, cy);
    // lower line
    ctx.lineTo(cx - size * 0.4, cy + size * 0.4);
    ctx.stroke();
}

export function drawGoalMarker(ctx: CanvasRenderingContext2D, p: Coord, s: number) {
    const [cx, cy] = center(p, s);
    const radius = Math.max(5, s * 0.35);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, radius * 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
}

export function drawMarkers(ctx: CanvasRenderingContext2D, start: Coord, goal: Coord, s: number) {
    drawStartMarker(ctx, start, s);
    drawGoalMarker(ctx, goal, s);
}

export function drawBaseScene(
    ctx: CanvasRenderingContext2D,
    rows: number,
    cols: number,
    cellSize: number,
    cells: ('empty' | 'wall')[],
    start: Coord,
    goal: Coord,
) {
    // background
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

    // cells
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const kind = cells[r * cols + c];
            ctx.fillStyle = kind === 'wall' ? palette.cellWall : palette.cellEmpty;
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
    }

    // grid lines
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 0.75;
    for (let r = 1; r < rows; r++) {
        const y = r * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cols * cellSize, y);
        ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
        const x = c * cellSize + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rows * cellSize);
        ctx.stroke();
    }

    ctx.strokeRect(0.5, 0.5, cols * cellSize - 1, rows * cellSize - 1);

    // markers
    drawMarkers(ctx, start, goal, cellSize);
}
