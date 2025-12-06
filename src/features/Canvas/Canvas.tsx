// features/Canvas/Canvas.tsx
'use client';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useCanvas } from './useCanvas';
import { CanvasHandle } from './types';

type Props = {
    rows: number;
    cols: number;
    cellSize: number;
    className?: string;
    style?: React.CSSProperties;
};

export const Canvas = forwardRef<CanvasHandle, Props>(function CanvasStage(
    { rows, cols, cellSize, className, style },
    ref,
) {
    const base = useCanvas(rows, cols, cellSize); // base layer for grid
    const overlay = useCanvas(rows, cols, cellSize); // overlay layer for paths and other stuff

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
