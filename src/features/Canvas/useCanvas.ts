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
        cv.width = Math.floor(cols * cellSize * dpr);
        cv.height = Math.floor(rows * cellSize * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctxRef.current = ctx;
    }, [rows, cols, cellSize]);

    return { ref, getCtx: () => ctxRef.current };
}
