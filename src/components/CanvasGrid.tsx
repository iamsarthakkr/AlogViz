'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { useGridStore } from '@/features/grid/store/useGridStore';
import { CellKind } from '@/features/grid/types';
import { drawAll, drawCell } from './painter';
import { getGridShapshot } from '@/features/grid/algo/getGridSnapshot';
import { bfs } from '@/features/grid/algo/bfs';
import { log } from 'console';

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
        [hitCell, paintAt],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (dragMode.current === DragMode.None) return;
            const { r, c } = hitCell(e);
            if (dragMode.current === DragMode.Paint) paintAt(r, c);
            else if (dragMode.current === DragMode.MoveStart) useGridStore.getState().setStart(r, c);
            else if (dragMode.current === DragMode.MoveGoal) useGridStore.getState().setGoal(r, c);
        },
        [hitCell, paintAt],
    );

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // no-op
        }
        dragMode.current = DragMode.None;
    }, []);

    const runBfsDemo = useCallback(() => {
        const snap = getGridShapshot();
        const gen = bfs(snap);

        const ctx = canvasRef.current!.getContext('2d')!;

        const cellSize = snap.cellSize;
        const perFrame = 10;
        const step = () => {
            for (let i = 0; i < perFrame; i++) {
                const res = gen.next();
                if (res.done) {
                    console.log('done', res.value);
                    return;
                }
                const event = res.value;
                if (event.type === 'enqueue') {
                    drawCell(ctx, event.at.r, event.at.c, cellSize, 'visiting');
                } else if (event.type === 'visit') {
                    drawCell(ctx, event.at.r, event.at.c, cellSize, 'visited');
                } else {
                    console.log({ event });
                }
            }
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', display: 'block' }}
            />
            <button onClick={runBfsDemo}>Run BFS</button>
        </>
    );
}
