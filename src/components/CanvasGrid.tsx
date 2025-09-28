'use client';

import React, { useEffect, useRef } from 'react';
import { CellKind, useGridStore } from '@/features/grid/store/useGridStore';
import { useShallow } from 'zustand/shallow';

// Tiny helpers to draw
function drawCell(ctx: CanvasRenderingContext2D, r: number, c: number, s: number, kind: 'empty' | 'wall') {
    ctx.fillStyle = kind === 'wall' ? '#3c3f46' : '#ffffff';
    ctx.fillRect(c * s, r * s, s, s);
}
function drawAll(ctx: CanvasRenderingContext2D, rows: number, cols: number, s: number, cells: ('empty' | 'wall')[]) {
    ctx.clearRect(0, 0, cols * s, rows * s);

    // cells
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            drawCell(ctx, r, c, s, cells[r * cols + c]);
        }

    // grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * s);
        ctx.lineTo(cols * s, r * s);
        ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * s, 0);
        ctx.lineTo(c * s, rows * s);
        ctx.stroke();
    }
}
function drawMarker(ctx: CanvasRenderingContext2D, r: number, c: number, s: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c * s + s / 2, r * s + s / 2, Math.max(4, s * 0.35), 0, Math.PI * 2);
    ctx.fill();
}

type DragMode = 'none' | 'paint' | 'move-start' | 'move-goal';
type Brush = 'wall' | 'erase';

export default function CanvasGrid() {
    const { rows, cols, cellSize, cells, start, goal } = useGridStore(
        useShallow((s) => ({
            rows: s.rows,
            cols: s.cols,
            cellSize: s.cellSize,
            cells: s.cells,
            start: s.start,
            goal: s.goal,
        })),
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragMode = useRef<DragMode>('none');
    const brush = useRef<Brush>('wall');
    const lastPainted = useRef<{ r: number; c: number; kind: CellKind } | null>(null);

    // Resize for DPR and (re)draw whenever store values change
    useEffect(() => {
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;

        // CSS pixels (layout size)
        canvas.style.width = `${cols * cellSize}px`;
        canvas.style.height = `${rows * cellSize}px`;

        // Device pixels (backing store)
        canvas.width = Math.floor(cols * cellSize * dpr);
        canvas.height = Math.floor(rows * cellSize * dpr);

        const ctx = canvas.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels

        drawAll(ctx, rows, cols, cellSize, cells);
        // draw markers on top
        drawMarker(ctx, start.r, start.c, cellSize, '#10b981');
        drawMarker(ctx, goal.r, goal.c, cellSize, '#ef4444');
    }, [rows, cols, cellSize, cells, start, goal]);

    // Mouse → cell
    const hitCell = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const r = Math.floor((e.clientY - rect.top) / cellSize);
        const c = Math.floor((e.clientX - rect.left) / cellSize);
        return { r, c };
    };

    // Handlers (use store actions imperatively to avoid re-render churn)
    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const { r, c } = hitCell(e);
        const s = useGridStore.getState();

        // Decide drag mode:
        if (r === s.start.r && c === s.start.c) {
            dragMode.current = 'move-start';
        } else if (r === s.goal.r && c === s.goal.c) {
            dragMode.current = 'move-goal';
        } else {
            dragMode.current = 'paint';
            brush.current = e.button === 2 || e.altKey ? 'erase' : 'wall';
            paintAt(r, c);
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (dragMode.current === 'none') return;
        const { r, c } = hitCell(e);
        if (dragMode.current === 'paint') paintAt(r, c);
        else if (dragMode.current === 'move-start') useGridStore.getState().setStart(r, c);
        else if (dragMode.current === 'move-goal') useGridStore.getState().setGoal(r, c);
    };

    const onMouseUp = () => {
        dragMode.current = 'none';
        lastPainted.current = null;
    };

    function paintAt(r: number, c: number) {
        const kind: CellKind = brush.current === 'wall' ? CellKind.wall : CellKind.empty;

        // avoid redundant writes if cursor stays in same cell with same value
        if (
            lastPainted.current &&
            lastPainted.current.r === r &&
            lastPainted.current.c === c &&
            lastPainted.current.kind === kind
        )
            return;

        useGridStore.getState().setCell(r, c, kind);

        // Immediately update just this cell for snappy feedback + re-draw markers
        const ctx = canvasRef.current!.getContext('2d')!;
        drawCell(ctx, r, c, cellSize, kind);
        const s = useGridStore.getState();
        drawMarker(ctx, s.start.r, s.start.c, cellSize, '#10b981');
        drawMarker(ctx, s.goal.r, s.goal.c, cellSize, '#ef4444');

        lastPainted.current = { r, c, kind };
    }

    return (
        <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', display: 'block' }}
        />
    );
}
