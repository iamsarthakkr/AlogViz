'use client';

import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useGridStore } from '@/features/grid/store/useGridStore';
import { CellKind } from '@/features/grid/types';
import { CanvasStage, CanvasStageHandle } from '@/components/CanvasStage';
import { clearOverlay } from './overlayPainter';
import { drawBaseScene } from './basePainter';

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
function useRafJob() {
    const rafId = useRef(0);
    const schedule = useCallback((job: () => void) => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
            rafId.current = 0;
            job();
        });
    }, []);
    useEffect(() => () => cancelAnimationFrame(rafId.current), []);
    return schedule;
}

/** The API CanvasGrid will expose to parents */
export type CanvasGridHandle = {
    getBaseCtx(): CanvasRenderingContext2D | null;
    getOverlayCtx(): CanvasRenderingContext2D | null;
    clearOverlay(): void;
    redrawBase(): void;
};

type CanvasGridProps = {
    /** disable user edits while an algo runs, if you want */
    interactive?: boolean;
    style?: React.CSSProperties;
    className?: string;
};

const CanvasGrid = forwardRef<CanvasGridHandle, CanvasGridProps>(function CanvasGrid(
    { interactive = true, style, className }: CanvasGridProps,
    ref,
) {
    const [rows, cols, cellSize, cells, start, goal] = useGridStore(
        useShallow((s) => [s.rows, s.cols, s.cellSize, s.cells, s.start, s.goal] as const),
    );

    const stageRef = useRef<CanvasStageHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const dragMode = useRef<DragMode>(DragMode.None);
    const brushRef = useRef<Brush>(Brush.Wall);

    const schedule = useRafJob();
    const scheduleOverlay = useRafJob();

    // ----- expose API to parent -----
    useImperativeHandle(
        ref,
        () => ({
            getBaseCtx: () => stageRef.current?.getBaseCtx() ?? null,
            getOverlayCtx: () => stageRef.current?.getOverlayCtx() ?? null,
            clearOverlay: () => {
                const ctx = stageRef.current?.getOverlayCtx();
                if (ctx) clearOverlay(ctx, rows, cols, cellSize);
            },
            redrawBase: () => {
                const ctx = stageRef.current?.getBaseCtx();
                if (ctx) drawBaseScene(ctx, rows, cols, cellSize, cells, start, goal);
            },
        }),
        [rows, cols, cellSize, cells, start, goal],
    );

    // rAF-batched base redraw on content changes
    useEffect(() => {
        const ctx = stageRef.current?.getBaseCtx();
        if (!ctx) return;
        schedule(() => drawBaseScene(ctx, rows, cols, cellSize, cells, start, goal));
    }, [rows, cols, cellSize, cells, start, goal, schedule]);

    // rAF-batched overlay clear on structural changes
    useEffect(() => {
        const ctx = stageRef.current?.getOverlayCtx();
        if (!ctx) return;
        scheduleOverlay(() => clearOverlay(ctx, rows, cols, cellSize));
    }, [rows, cols, cellSize, scheduleOverlay]);

    // hit testing
    const hitCell = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const rect = wrapperRef.current!.getBoundingClientRect();
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
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!interactive) return;
            e.preventDefault();
            const cv = e.currentTarget;
            try {
                cv.setPointerCapture(e.pointerId);
            } catch {
                // no-op
            }

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
        [interactive, hitCell, paintAt],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!interactive) return;
            if (dragMode.current === DragMode.None) return;
            const { r, c } = hitCell(e);
            if (dragMode.current === DragMode.Paint) paintAt(r, c);
            else if (dragMode.current === DragMode.MoveStart) useGridStore.getState().setStart(r, c);
            else if (dragMode.current === DragMode.MoveGoal) useGridStore.getState().setGoal(r, c);
        },
        [interactive, hitCell, paintAt],
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!interactive) return;
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // no-op
            }
            dragMode.current = DragMode.None;
        },
        [interactive],
    );
    const width = cols * cellSize;
    const height = rows * cellSize;

    return (
        <div
            ref={wrapperRef}
            className={className}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
                position: 'relative',
                width,
                height,
                background: '#fff',
                ...style,
            }}
        >
            <CanvasStage ref={stageRef} rows={rows} cols={cols} cellSize={cellSize} />
        </div>
    );
});

export default CanvasGrid;
