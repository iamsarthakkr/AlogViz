'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRunner } from '@/features/grid/animations/runner'; // event-only version
import { paintAlgoEvent, clearOverlay } from '@/features/grid/ui/overlayPainter';
import { useGridStore } from '@/features/grid/store/useGridStore';
import type { CanvasGridHandle } from '@/features/grid/ui/CanvasGrid';
import { Coord } from '../types';
import { AlgoEvent, PathFinder } from '../algo/types';
import { getGridShapshot } from '../algo/getGridSnapshot';
import { useShallow } from 'zustand/shallow';

/** Optional: rAF path trace (animate final path nodes) */
function animatePath(
    ctx: CanvasRenderingContext2D,
    nodes: Coord[],
    cellSize: number,
    nps = 240, // nodes per second
) {
    if (!nodes.length) return () => {};
    let i = 0;
    let raf = 0;
    const perFrame = Math.max(1, Math.ceil(nps / 60));
    const center = (p: Coord) => [p.c * cellSize + cellSize / 2, p.r * cellSize + cellSize / 2] as const;

    const step = () => {
        for (let k = 0; k < perFrame && i < nodes.length - 1; k++, i++) {
            const [x1, y1] = center(nodes[i]);
            const [x2, y2] = center(nodes[i + 1]);
            ctx.strokeStyle = '#22c55e'; // comes from palette in painter if you prefer
            ctx.lineWidth = Math.max(2, cellSize * 0.25);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        if (i < nodes.length - 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
}

/**
 * Bridges a CanvasGrid (overlay ctx) and a pathfinder.
 * Uses overlayPainter to render events; base layer is managed by CanvasGrid itself.
 */
export function useAlgoRunner(gridRef: React.RefObject<CanvasGridHandle | null>) {
    // UI state
    const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
    const [speed, setSpeed] = useState(180); // events/sec
    const [pathLen, setPathLen] = useState<number | null>(null);
    const [visitedApprox, setVisitedApprox] = useState(0); // count visits from events

    // runner + anim refs
    const runnerRef = useRef<ReturnType<typeof createRunner<AlgoEvent>> | null>(null);
    const cancelPathAnimRef = useRef<() => void>(() => {});
    const sawPathEventRef = useRef(false);

    // sizing for painters
    const [rows, cols, cellSize] = useGridStore(useShallow((s) => [s.rows, s.cols, s.cellSize] as const));

    // get overlay ctx from CanvasGrid
    const getOverlayCtx = useCallback(() => gridRef.current?.getOverlayCtx() ?? null, [gridRef]);

    /** Start a run with the given pathfinder */
    const init = useCallback(
        (
            algo: PathFinder,
            opts?: { speed?: number; drawPathInstant?: boolean; animatePath?: boolean; pathNps?: number },
        ) => {
            const ctx = getOverlayCtx();
            if (!ctx) return;

            // stop any active run/animation
            runnerRef.current?.pause();
            cancelPathAnimRef.current?.();
            runnerRef.current = null;
            sawPathEventRef.current = false;
            setVisitedApprox(0);
            setPathLen(null);

            // optional speed override
            if (opts?.speed) setSpeed(opts.speed);

            // clear overlay fresh
            clearOverlay(ctx, rows, cols, cellSize);

            const snap = getGridShapshot();
            const gen = algo(snap);

            const drawInstant = opts?.drawPathInstant ?? false;
            const doAnimate = opts?.animatePath ?? !drawInstant;

            // per-event painting
            const onEvent = (e: AlgoEvent) => {
                // paint enqueue/visit, and path (instant if requested)
                paintAlgoEvent(ctx, cellSize, e, { start: snap.start, goal: snap.goal, drawPathInstant: drawInstant });

                if (e.type === 'visit') setVisitedApprox((v) => v + 1);

                if (e.type === 'path') {
                    sawPathEventRef.current = true;
                    setStatus('done');
                    setPathLen(e.nodes.length);

                    // animate the final path if desired (instead of instant draw)
                    if (doAnimate && e.nodes.length) {
                        cancelPathAnimRef.current?.();
                        cancelPathAnimRef.current = animatePath(ctx, e.nodes, cellSize, opts?.pathNps ?? 240);
                    }
                }
            };

            const r = createRunner(gen, onEvent, {
                speed: opts?.speed ?? speed,
                autoplay: false,
                onFinish: () => {
                    // if algo finished without a path event → no path case
                    if (!sawPathEventRef.current) {
                        setStatus('done');
                        setPathLen(0);
                    }
                },
            });

            runnerRef.current = r;
            setStatus('running');
        },
        [cellSize, getOverlayCtx, rows, cols, speed],
    );

    // controls
    const play = useCallback(() => {
        runnerRef.current?.play();
        setStatus('running');
    }, []);
    const pause = useCallback(() => {
        runnerRef.current?.pause();
        setStatus('paused');
    }, []);
    const step = useCallback(() => {
        const res = runnerRef.current?.step();
        if (!res) return;
        if (res.done) {
            if (!sawPathEventRef.current) setPathLen(0);
            setStatus('done');
        } else {
            setStatus('paused');
        }
    }, []);
    const skipToEnd = useCallback(() => {
        runnerRef.current?.skipToEnd();
        if (!sawPathEventRef.current) setPathLen(0);
        setStatus('done');
    }, []);
    const changeSpeed = useCallback((eps: number) => {
        setSpeed(eps);
        runnerRef.current?.setSpeed(eps);
    }, []);

    // cleanup
    useEffect(() => {
        return () => {
            runnerRef.current?.pause();
            cancelPathAnimRef.current?.();
        };
    }, []);

    return {
        init,

        // state
        status,
        speed,
        pathLen,
        visitedApprox,

        // controls
        play,
        pause,
        step,
        skipToEnd,
        setSpeed: changeSpeed,

        // convenience
        isRunning: runnerRef.current?.isRunning() ?? false,
    };
}
