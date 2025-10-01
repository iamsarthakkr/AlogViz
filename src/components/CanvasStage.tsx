// features/grid/ui/CanvasStage.tsx
'use client';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useCanvasLayer } from './useCanvasLayer';

export type CanvasStageHandle = {
    /** 2D contexts for drawing */
    getBaseCtx(): CanvasRenderingContext2D | null;
    getOverlayCtx(): CanvasRenderingContext2D | null;
};

type Props = {
    rows: number;
    cols: number;
    cellSize: number;
    className?: string;
    style?: React.CSSProperties;
};

export const CanvasStage = forwardRef<CanvasStageHandle, Props>(function CanvasStage(
    { rows, cols, cellSize, className, style },
    ref,
) {
    const base = useCanvasLayer(rows, cols, cellSize);
    const overlay = useCanvasLayer(rows, cols, cellSize);

    useImperativeHandle(
        ref,
        () => ({
            getBaseCtx: base.getCtx,
            getOverlayCtx: overlay.getCtx,
        }),
        [base.getCtx, overlay.getCtx],
    );

    const w = cols * cellSize,
        h = rows * cellSize;

    return (
        <div style={{ ...style, position: 'relative', width: w, height: h }} className={className}>
            <canvas ref={base.ref} style={{ position: 'absolute', inset: 0 }} />
            <canvas ref={overlay.ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        </div>
    );
});
