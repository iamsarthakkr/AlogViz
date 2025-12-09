'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Callback, Callback1 } from '@/types/common';
import { AlgoStatus, type AlgoEvent, type PathFinder } from '@/types/algo';
import type { CanvasGridHandle } from '@features/CanvasGrid';
import { useGridStore } from '@/features/store';
import { paintAlgoEvent, animateFinalPath, drawMarkers } from '@/features/painters';

import { createRunner, RunnerApi } from './runner';
import { getGridSnapshot } from './utils';
import { GridSnapShot } from '@/types/grid';

export type AlgoController = {
    currentAlgo: string;
    setAlgorithm: Callback1<string>;

    status: string;
    speed: number;
    pathLen: number | null;
    visitedApprox: number;

    clear: Callback;
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

    const getEventHandler = useCallback(
        (snap: GridSnapShot, instant: boolean): ((e: AlgoEvent) => void) => {
            const ctx = gridRef.current?.getOverlayCtx() ?? null;
            if (!ctx) {
                return () => { };
            }

            const { cellSize } = snap;
            return (event) => {
                const api = useGridStore.getState();

                paintAlgoEvent(ctx, cellSize, event, {
                    start: snap.start,
                    goal: snap.goal,
                    validStart: api.validStart(),
                    validGoal: api.validGoal(),
                    drawPathInstant: instant,
                });
                if (event.type === 'visit') setVisitedApprox((v) => v + 1);
                if (event.type === 'path') {
                    sawPathEventRef.current = true;
                    setStatus('done');
                    setPathLen(event.nodes.length);

                    api.setGridLock(false);

                    if (!instant && event.nodes.length) {
                        if (cancelPathAnimRef.current) {
                            cancelPathAnimRef.current();
                        }
                        cancelPathAnimRef.current = animateFinalPath(
                            ctx,
                            event.nodes,
                            cellSize,
                            opts.pathNps ?? 240,
                            () =>
                                drawMarkers(
                                    ctx,
                                    snap.start,
                                    snap.goal,
                                    api.validStart(),
                                    api.validGoal(),
                                    snap.cellSize,
                                ),
                        );
                    }
                }
            };
        },
        [gridRef, opts],
    );

    const createRunnerFor = useCallback(
        (key: string, instant: boolean = opts.animatePath ?? false) => {
            const algo = registry[key];
            if (!algo) return null;

            const currentKey = currentKeyRef.current ?? '';
            runners.current.get(currentKey)?.runner.pause();

            currentKeyRef.current = key;

            const snap = getGridSnapshot();
            if (!snap) {
                return;
            }

            // stop any previous path animation for safety
            cancelPathAnimRef.current?.();
            gridRef.current?.clearOverlay();

            const gen = algo(snap);

            setVisitedApprox(0);
            setPathLen(null);
            sawPathEventRef.current = false;

            const r = createRunner(gen, getEventHandler(snap, instant), {
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
            setStatus('ready');
            return r;
        },
        [getEventHandler, gridRef, opts, registry],
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

    // whenever the grid changes, we need to reset the runner and skip to end (if previous is already finished)
    useEffect(() => {
        const current = runners.current.get(currentKeyRef.current);
        if (current && current.buildVersion !== gridVersion) {
            current.runner.pause();
            const instant = current.runner.getStatus() === AlgoStatus.done;
            const r = createRunnerFor(currentKeyRef.current, instant);
            if (instant) {
                r?.skipToEnd();
            }
        }
    }, [createRunnerFor, gridVersion]);

    /** Public API to switch algorithm */
    const setAlgorithm = useCallback((key: string) => {
        setAlgoKey(key);
        currentKeyRef.current = key;
    }, []);

    // Controls operate on current runner -> can be sure the runner is upto date and created
    const play = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;

        const api = useGridStore.getState();
        api.setGridLock(true);

        runner.play();
        setStatus('running');
    }, [getOrCreateCurrent]);

    const pause = useCallback(() => {
        const runner = getOrCreateCurrent();
        if (!runner) return;

        const api = useGridStore.getState();
        api.setGridLock(false);

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

        const api = useGridStore.getState();
        api.setGridLock(false);

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

    const clear = useCallback(() => {
        const currentKey = currentKeyRef.current ?? '';
        runners.current.get(currentKey)?.runner.pause();
        createRunnerFor(currentKeyRef.current);
        gridRef.current?.clearOverlay();
    }, [createRunnerFor, gridRef]);

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

        clear,
        play,
        pause,
        step,
        skipToEnd,
        setSpeed: setEps,

        recreate: () => createRunnerFor(currentKeyRef.current),
    };
}
