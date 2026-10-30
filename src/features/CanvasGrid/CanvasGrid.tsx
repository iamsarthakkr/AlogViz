// Authored by - Sarthak Kumar
//
// CanvasGrid: the interactive grid surface — owns pointer input and base-layer redraws.
// - Pointer handlers: paint walls, drag start/goal markers. A drag erases if it starts on a wall
//   (so touch can erase) or uses right-click/Alt; the brush is fixed for the whole drag
// - Redraws the base canvas via drawBaseScene whenever grid state changes (debounced via useRaf)
// - Exposes CanvasGridHandle (ctx getters, clearOverlay, redrawBase) for the toolbar/animation hooks
// - Respects gridLock: pointer editing is a no-op while an algorithm/maze run owns the grid

import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { Brush, CellKind, DragMode } from '@/types/grid';
import { useGridStore } from '@/features/store';
import { CanvasStage, CanvasStageHandle } from '@/components/CanvasStage';
import { clearOverlay, drawBaseScene } from '@/features/painters';
import { useRaf } from '@/features/hooks/useRaf';

/** The API CanvasGrid will expose to parents */
export type CanvasGridHandle = {
    getBaseCtx(): CanvasRenderingContext2D | null;
    getOverlayCtx(): CanvasRenderingContext2D | null;
    clearOverlay(): void;
    redrawBase(): void;
};

type CanvasGridProps = {
    /** disable user edits while an algo runs, if you want */
    style?: React.CSSProperties;
    className?: string;
};

export const CanvasGrid = forwardRef<CanvasGridHandle, CanvasGridProps>(function CanvasGrid(
    { style, className }: CanvasGridProps,
    ref,
) {
    const [rows, cols, cellSize, cells, weights, start, goal] = useGridStore(
        useShallow((s) => [s.rows, s.cols, s.cellSize, s.cells, s.weights, s.start, s.goal] as const),
    );

    const stageRef = useRef<CanvasStageHandle>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const dragMode = useRef<DragMode>(DragMode.None);
    const brushRef = useRef<Brush>(Brush.Wall);

    const schedule = useRaf();

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
                const api = useGridStore.getState();
                if (ctx)
                    drawBaseScene({
                        ctx,
                        rows,
                        cols,
                        cellSize,
                        cells,
                        weights,
                        start,
                        goal,
                        validStart: api.validStart(),
                        validGoal: api.validGoal(),
                    });
            },
        }),
        [rows, cols, cellSize, cells, weights, start, goal],
    );

    // animation frames schedule
    useEffect(() => {
        const ctx = stageRef.current?.getBaseCtx();
        if (!ctx) return;
        schedule(() => {
            const api = useGridStore.getState();
            drawBaseScene({
                ctx,
                rows,
                cols,
                cellSize,
                cells,
                weights,
                start,
                goal,
                validStart: api.validStart(),
                validGoal: api.validGoal(),
            });
        });
    }, [rows, cols, cellSize, cells, weights, start, goal, schedule]);

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
        if (want === CellKind.wall) {
            api.setWall(r, c);
        } else {
            api.clearWall(r, c);
        }
        api.refresh();
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const api = useGridStore.getState();
            if (api.gridLock) return;

            e.preventDefault();
            const cv = e.currentTarget;
            try {
                cv.setPointerCapture(e.pointerId);
            } catch {
                // no-op
                console.error('failed to capture: ' + e);
            }

            const { r, c } = hitCell(e);

            if (r === api.start.r && c === api.start.c) {
                dragMode.current = DragMode.MoveStart;
            } else if (r === api.goal.r && c === api.goal.c) {
                dragMode.current = DragMode.MoveGoal;
            } else {
                const startsOnWall = api.inBounds(r, c) && api.at(r, c) === CellKind.wall;
                dragMode.current = DragMode.Paint;
                brushRef.current = e.button === 2 || e.altKey || startsOnWall ? Brush.Erase : Brush.Wall;
                paintAt(r, c);
            }
        },
        [hitCell, paintAt],
    );

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            console.error('failed to release capture: ' + e);
        }
        dragMode.current = DragMode.None;
    }, []);

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (useGridStore.getState().gridLock) return;
            if (dragMode.current === DragMode.None) return;
            const api = useGridStore.getState();
            const { r, c } = hitCell(e);
            if (dragMode.current === DragMode.Paint) paintAt(r, c);
            else if (dragMode.current === DragMode.MoveStart) api.setStart(r, c);
            else if (dragMode.current === DragMode.MoveGoal) api.setGoal(r, c);
            api.refresh();
        },
        [hitCell, paintAt],
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
            onPointerCancel={onPointerUp}
            style={{
                position: 'relative',
                width,
                height,
                background: '#fff',
                touchAction: 'none',
                ...style,
            }}
        >
            <CanvasStage ref={stageRef} rows={rows} cols={cols} cellSize={cellSize} />
        </div>
    );
});
