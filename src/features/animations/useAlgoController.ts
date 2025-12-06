'use client';

import { cache, useCallback, useEffect, useRef, useState } from 'react';
import { Callback, Callback1 } from '@/types/common';
import { AlgoStatus, type AlgoEvent, type PathFinder } from '@/types/algo';
import type { CanvasGridHandle } from '@features/CanvasGrid';
import { useGridStore } from '@/features/store';
import { paintAlgoEvent, clearOverlay, animateFinalPath, drawMarkers } from '@/features/painters';

import { createRunner, RunnerApi } from './runner';
import { getGridSnapshot } from './utils';

export type AlgoController = {
    currentAlgo: string;
    setAlgorithm: Callback1<string>;

    status: string;
    speed: number;
    pathLen: number | null;
    visitedApprox: number;

    play: Callback;
    pause: Callback;
    step: Callback;
    skipToEnd: Callback;
    setSpeed: Callback1<number>;

    recreate: Callback;
};

export type AlgoRegistry = Record<string, PathFinder>;

type Options = {
    initialAlgo?: string; // default: first key of registry
    initialSpeed?: number; // EPS
    animatePath?: boolean; // default true (if false, path is drawn instantly)
    pathNps?: number; // nodes/sec for path trace if animating
};

type CachedRunner = { runner: RunnerApi<AlgoEvent>; buildVersion: number };

export function useAlgoController(
    gridRef: React.RefObject<CanvasGridHandle | null>,
    registry: AlgoRegistry,
    opts: Options = {},
): AlgoController {
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
    const cancelPathAnimRef = useRef<Callback>(() => { });
    const sawPathEventRef = useRef(false);
    const currentKeyRef = useRef<string>(defaultKey);
    const speedRef = useRef(speed);

    const createRunnerFor = useCallback(
        (key: string, instant: boolean = opts.animatePath || false) => {
            const ctx = gridRef.current?.getOverlayCtx() ?? null;
            const algo = registry[key];
            if (!ctx || !algo) return null;

            const snap = getGridSnapshot();
            const { rows, cols, cellSize } = snap;

            // stop any previous path animation for safety
            cancelPathAnimRef.current?.();
            clearOverlay(ctx, rows, cols, cellSize);

            const gen = algo(snap);

            setVisitedApprox(0);
            setPathLen(null);
            sawPathEventRef.current = false;

            const doAnimate = !instant;
            const onEvent = (e: AlgoEvent) => {
                paintAlgoEvent(ctx, cellSize, e, { start: snap.start, goal: snap.goal, drawPathInstant: !doAnimate });
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

    // get's the current runner for the algorithm. If none present or the current one is already finished, it will create a new runner.
    const getOrCreateCurrent = useCallback(() => {
        const key = currentKeyRef.current ?? algoKey;

        const cached = runners.current.get(key);
        if (
            !cached ||
            cached.buildVersion !== gridVersion ||
            (cached && cached.runner.getStatus() == AlgoStatus.done)
        ) {
            return createRunnerFor(key);
        }
        return cached.runner;
    }, [algoKey, createRunnerFor, gridVersion]);

    // whenever the grid changes, we need to reset the runner and skip to end
    useEffect(() => {
        const current = runners.current.get(currentKeyRef.current);
        if (current && current.buildVersion !== gridVersion) {
            current.runner.pause();
            const r = createRunnerFor(currentKeyRef.current, true);
            r?.skipToEnd();
        }
    }, [createRunnerFor, gridVersion]);

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

    // Controls operate on current runner -> can be sure the runner is upto date and created
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
        currentAlgo: algoKey,
        setAlgorithm,

        status,
        speed,
        pathLen,
        visitedApprox,

        play,
        pause,
        step,
        skipToEnd,
        setSpeed: setEps,

        recreate: () => createRunnerFor(currentKeyRef.current),
    };
}
