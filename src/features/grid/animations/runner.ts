export type RunnerApi<TYield> = {
    play(): void;
    pause(): void;
    step(): IteratorResult<TYield, void>;
    skipToEnd(): void;
    setSpeed(eps: number): void; // events per second
    isRunning(): boolean;
    finished: Promise<void>; // resolves when generator completes
};

type RunnerOptions = {
    speed?: number; // events/sec; default 120
    maxBatchPerFrame?: number; // safety cap; default 1000
    autoplay?: boolean; // default false
    onFinish?: () => void; // optional callback on completion
};

export function createRunner<TYield>(
    gen: Generator<TYield, void, void>,
    onEvent: (e: TYield) => void,
    opts: RunnerOptions = {},
): RunnerApi<TYield> {
    let running = false;
    let rafId = 0;
    let eps = Math.max(1, opts.speed ?? 120);
    const maxBatch = Math.max(1, opts.maxBatchPerFrame ?? 1000);

    let resolveFinished!: () => void;
    const finished = new Promise<void>((res) => (resolveFinished = res));

    const perFrame = () => Math.min(maxBatch, Math.max(1, Math.ceil(eps / 60)));

    const tick = () => {
        if (!running) return;
        const n = perFrame();
        for (let i = 0; i < n; i++) {
            const res = gen.next();
            if (res.done) {
                running = false;
                resolveFinished();
                opts.onFinish?.();
                return;
            }
            onEvent(res.value);
        }
        rafId = requestAnimationFrame(tick);
    };

    const controls: RunnerApi<TYield> = {
        play() {
            if (running) return;
            running = true;
            rafId = requestAnimationFrame(tick);
        },
        pause() {
            if (!running) return;
            running = false;
            cancelAnimationFrame(rafId);
        },
        step() {
            const res = gen.next();
            if (!res.done) onEvent(res.value);
            else {
                resolveFinished();
                opts.onFinish?.();
            }
            return res;
        },
        skipToEnd() {
            let res: IteratorResult<TYield, void>;
            do {
                res = gen.next();
                if (!res.done) onEvent(res.value);
            } while (!res.done);
            controls.pause();
            resolveFinished();
            opts.onFinish?.();
        },
        setSpeed(newEps: number) {
            eps = Math.max(1, newEps || 1);
        },
        isRunning() {
            return running;
        },
        get finished() {
            return finished;
        },
    };

    if (opts.autoplay) controls.play();
    return controls;
}
