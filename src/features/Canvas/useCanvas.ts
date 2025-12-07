'use client';
import { useEffect, useRef } from 'react';

// hook to set canvas properties
export function useCanvas(rows: number, cols: number, cellSize: number) {
    const ref = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const cv = ref.current!;
        const ctx = cv.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;

        cv.style.width = `${cols * cellSize}px`;
        cv.style.height = `${rows * cellSize}px`;

        cv.width = cols * cellSize * dpr;
        cv.height = rows * cellSize * dpr;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.imageSmoothingEnabled = true;
        ctxRef.current = ctx;
    }, [rows, cols, cellSize]);

    return { ref, getCtx: () => ctxRef.current };
}
