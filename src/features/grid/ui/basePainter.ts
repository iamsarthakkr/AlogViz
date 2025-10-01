import type { Coord } from '@/features/grid/types';
import { lightPalette as palette } from './colors';

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
    drawMarker(ctx, start, cellSize, palette.start);
    drawMarker(ctx, goal, cellSize, palette.goal);
}

function drawMarker(ctx: CanvasRenderingContext2D, p: Coord, s: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.c * s + s / 2, p.r * s + s / 2, Math.max(4, s * 0.35), 0, Math.PI * 2);
    ctx.fill();
}
