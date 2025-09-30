'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { useGridStore } from '@/features/grid/store/useGridStore';
import { CellKind } from '@/features/grid/types';

// ---------- drawing helpers ----------
const drawCell = (ctx: CanvasRenderingContext2D, r: number, c: number, s: number, kind: 'empty' | 'wall') => {
    ctx.fillStyle = kind === 'wall' ? '#3c3f46' : '#ffffff';
    ctx.fillRect(c * s, r * s, s, s);
};

const drawGridLines = (ctx: CanvasRenderingContext2D, rows: number, cols: number, s: number) => {
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

const drawMarkers = (
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

const drawAll = (
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

// ---------- component ----------
enum DragMode {
    None,
    Paint,
    MoveStart,
    MoveGoal,
}
enum Brush {
    Wall,
    Erase,
}

export default function CanvasGrid() {
    const [rows, cols, cellSize, cells, start, goal] = useGridStore(
        useShallow((s) => [s.rows, s.cols, s.cellSize, s.cells, s.start, s.goal] as const),
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragMode = useRef<DragMode>(DragMode.None);
    const brushRef = useRef<Brush>(Brush.Wall);

    useEffect(() => {
        const cv = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;

        cv.style.width = `${cols * cellSize}px`;
        cv.style.height = `${rows * cellSize}px`;

        cv.width = Math.floor(cols * cellSize * dpr);
        cv.height = Math.floor(rows * cellSize * dpr);

        const ctx = cv.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
    }, [rows, cols, cellSize]);

    useEffect(() => {
        const cv = canvasRef.current!;
        const ctx = cv.getContext('2d')!;
        let raf = 0;

        raf = requestAnimationFrame(() => {
            drawAll(ctx, rows, cols, cellSize, cells, start, goal);
        });

        return () => cancelAnimationFrame(raf);
    }, [rows, cols, cellSize, cells, start, goal]);

    const hitCell = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const r = Math.floor((e.clientY - rect.top) / cellSize);
            const c = Math.floor((e.clientX - rect.left) / cellSize);
            return { r, c };
        },
        [cellSize],
    );

    const paintAt = useCallback((r: number, c: number) => {
        const api = useGridStore.getState();
        if (r < 0 || c < 0 || r >= api.rows || c >= api.cols) return;
        const k = api.idx(r, c);
        const sId = api.idx(api.start.r, api.start.c);
        const gId = api.idx(api.goal.r, api.goal.c);
        if (k === sId || k === gId) return;

        const want: CellKind = brushRef.current === Brush.Wall ? CellKind.wall : CellKind.empty;
        if (api.cells[k] === want) return;
        api.setCell(r, c, want);
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            e.preventDefault();
            const cv = e.currentTarget;
            cv.setPointerCapture(e.pointerId);

            const { r, c } = hitCell(e);
            const s = useGridStore.getState();

            if (r === s.start.r && c === s.start.c) {
                dragMode.current = DragMode.MoveStart;
            } else if (r === s.goal.r && c === s.goal.c) {
                dragMode.current = DragMode.MoveGoal;
            } else {
                dragMode.current = DragMode.Paint;
                brushRef.current = e.button === 2 || e.altKey ? Brush.Erase : Brush.Wall;
                paintAt(r, c);
            }
        },
        [hitCell],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (dragMode.current === DragMode.None) return;
            const { r, c } = hitCell(e);
            if (dragMode.current === DragMode.Paint) paintAt(r, c);
            else if (dragMode.current === DragMode.MoveStart) useGridStore.getState().setStart(r, c);
            else if (dragMode.current === DragMode.MoveGoal) useGridStore.getState().setGoal(r, c);
        },
        [hitCell],
    );

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // no-op
        }
        dragMode.current = DragMode.None;
    }, []);

    return (
        <canvas
            ref={canvasRef}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', display: 'block' }}
        />
    );
}
