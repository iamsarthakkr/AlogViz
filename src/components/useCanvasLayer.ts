// Authored by - Sarthak Kumar
//
// useCanvasLayer: sizes a single <canvas> for devicePixelRatio and hands back its 2D ctx.
// - Sets CSS size (logical px) vs canvas.width/height (physical px) separately
// - Applies the DPR transform once so callers draw in logical coordinates
// - Sizes in a layout effect: setting canvas.width wipes it, so it must happen before any passive
//   effect repaints (see ARCHITECTURE.md §3)
// - getCtx is stable (useCallback), so callers can put it in effect deps without redrawing every render

import React, { useRef } from 'react';

export function useCanvasLayer(rows: number, cols: number, cellSize: number) {
    const ref = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    React.useLayoutEffect(() => {
        const cv = ref.current!;
        const dpr = window.devicePixelRatio || 1;
        cv.style.width = `${cols * cellSize}px`;
        cv.style.height = `${rows * cellSize}px`;
        cv.width = Math.floor(cols * cellSize * dpr);
        cv.height = Math.floor(rows * cellSize * dpr);
        const ctx = cv.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctxRef.current = ctx;
    }, [rows, cols, cellSize]);

    const getCtx = React.useCallback(() => ctxRef.current, []);

    return { ref, getCtx };
}
