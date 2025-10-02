'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgoEvent, PathFinder } from '@/features/grid/algo/types';
import type { CanvasGridHandle } from '@/features/grid/ui/CanvasGrid';
import { useGridStore } from '@/features/grid/store/useGridStore';

import { createRunner, RunnerApi } from '@/features/grid/animations/runner';
import { paintAlgoEvent, clearOverlay, animateFinalPath } from '@/features/grid/ui/overlayPainter';
import { getGridShapshot } from '../algo/getGridSnapshot';
import { drawMarkers } from '../ui/basePainter';

export type AlgoRegistry = Record<string, PathFinder>;

type Options = {
    initialAlgo?: string; // default: first key of registry
    initialSpeed?: number; // EPS
    animatePath?: boolean; // default true (if false, path is drawn instantly)
    pathNps?: number; // nodes/sec for path trace if animating
};

type CachedRunner = { runner: RunnerApi<AlgoEvent>; buildVersion: number };

export function useAlgoRunner(
    gridRef: React.RefObject<CanvasGridHandle | null>,
    registry: AlgoRegistry,
    opts: Options = {},
) {
    const algoKeys = Object.keys(registry);
    const defaultKey = opts.initialAlgo && registry[opts.initialAlgo] ? opts.initialAlgo : algoKeys[0];

    // UI state
    const [algoKey, setAlgoKey] = useState<string>(defaultKey);
    const [status, setStatus] = useState<'idle' | 'ready' | 'running' | 'paused' | 'done'>('idle');
    const [speed, setSpeed] = useState<number>(opts.initialSpeed ?? 180);
    const [pathLen, setPathLen] = useState<number | null>(null);
    const [visitedApprox, setVisitedApprox] = useState<number>(0);

    const gridVersion = useGridStore((s) => s.gridVersion);

    const runners = useRef(new Map<string, CachedRunner>());
    const cancelPathAnimRef = useRef<() => void>(() => {});
    const sawPathEventRef = useRef(false);
    const currentKeyRef = useRef<string>(defaultKey);
    const speedRef = useRef(speed);

    const createRunnerFor = useCallback(
        (key: string) => {
            const ctx = gridRef.current?.getOverlayCtx() ?? null;
            const algo = registry[key];
            if (!ctx || !algo) return null;

            // stop any previous path animation for safety
            cancelPathAnimRef.current?.();

            const snap = getGridShapshot();
            const { rows, cols, cellSize } = snap;

            // fresh overlay for new run
            clearOverlay(ctx, rows, cols, cellSize);
            const gen = algo(snap);

            setVisitedApprox(0);
            setPathLen(null);
            sawPathEventRef.current = false;

            const drawInstant = opts.animatePath === false;
            const doAnimate = !drawInstant;
            const onEvent = (e: AlgoEvent) => {
                paintAlgoEvent(ctx, cellSize, e, { start: snap.start, goal: snap.goal });
                if (e.type === 'visit') setVisitedApprox((v) => v + 1);
                if (e.type === 'path') {
                    sawPathEventRef.current = true;
                    setStatus('done');
                    setPathLen(e.nodes.length);

                    if (doAnimate && e.nodes.length) {
                        cancelPathAnimRef.current?.();
                        cancelPathAnimRef.current = animateFinalPath(ctx, e.nodes, cellSize, opts.pathNps ?? 240, () =>
                            drawMarkers(ctx, snap.start, snap.goal, snap.cellSize),
                        );
                    }
                }
            };

            const r = createRunner(gen, onEvent, {
                speed: speedRef.current,
                autoplay: false,
                onFinish: () => {
                    if (!sawPathEventRef.current) {
                        setStatus('done');
                        setPathLen(0);
                    }
                },
            });

            runners.current.set(key, { runner: r, buildVersion: snap.gridVersion });
            currentKeyRef.current = key;
            setStatus('ready');
            return r;
        },
        [gridRef, opts, registry],
    );

    const getOrCreateCurrent = useCallback(() => {
        const key = currentKeyRef.current ?? algoKey;

        const cached = runners.current.get(key);
        if (!cached || cached.buildVersion !== gridVersion) {
            return createRunnerFor(key);
        }
        return cached.runner;
    }, [algoKey, createRunnerFor, gridVersion]);

    /** Public API to switch algorithm */
    const setAlgorithm = useCallback(
        (key: string) => {
            if (!registry[key]) return;
            const currentKey = currentKeyRef.current ?? '';
            runners.current.get(currentKey)?.runner.pause();
            setAlgoKey(key);
            currentKeyRef.current = key;
            setStatus('ready');
        },
        [registry],
    );

    // Controls operate on current runner
    const play = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;
        runner.play();
        setStatus('running');
    }, [getOrCreateCurrent]);

    const pause = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;
        runner.pause();
        setStatus('paused');
    }, [getOrCreateCurrent]);

    const step = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;
        const res = runner.step();
        if (res.done) {
            if (!sawPathEventRef.current) setPathLen(0);
            setStatus('done');
        } else {
            setStatus('paused');
        }
    }, [getOrCreateCurrent]);

    const skipToEnd = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;
        runner.skipToEnd();
        if (!sawPathEventRef.current) setPathLen(0);
        setStatus('done');
    }, [getOrCreateCurrent]);

    const setEps = useCallback(
        (eps: number) => {
            speedRef.current = Math.max(1, eps);
            setSpeed(speedRef.current);
            const runner = getOrCreateCurrent();
            runner?.setSpeed(eps);
        },
        [getOrCreateCurrent],
    );

    // Cleanup on unmount
    const cleanup = () => {
        for (const r of runners.current.values()) r.runner.pause();
        cancelPathAnimRef.current?.();
        runners.current.clear();
        currentKeyRef.current = '';
    };
    useEffect(() => cleanup, []);

    return {
        algorithms: algoKeys, // list for your dropdown
        currentAlgo: algoKey,
        setAlgorithm, // call to switch

        // status & telemetry
        status,
        speed,
        pathLen,
        visitedApprox,

        // controls
        play,
        pause,
        step,
        skipToEnd,
        setSpeed: setEps,

        // utilities
        recreate: () => createRunnerFor(currentKeyRef.current!), // rebuild current
    };
}
