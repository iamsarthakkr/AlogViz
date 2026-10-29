import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRunner } from '@/features/animations/runner';
import { AlgoStatus } from '@/types/algo';
import { installFakeRaf } from '../../helpers/raf';

function* count(n: number) {
    for (let i = 0; i < n; i++) yield i;
}

describe('createRunner', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
    });

    it('does nothing until played', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(5), onEvent);
        raf.flush();
        expect(onEvent).not.toHaveBeenCalled();
        expect(runner.getStatus()).toBe(AlgoStatus.initial);
        expect(runner.isRunning()).toBe(false);
    });

    it('autoplay starts on creation', () => {
        const onEvent = vi.fn();
        createRunner(count(3), onEvent, { autoplay: true });
        raf.flush();
        expect(onEvent.mock.calls.map(([e]) => e)).toEqual([0, 1, 2]);
    });

    it('delivers ceil(eps / 60) events per frame', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(100), onEvent, { speed: 300 }); // 5 per frame
        runner.play();
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(5);
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(10);
    });

    it('delivers at least one event per frame at very low speeds', () => {
        const onEvent = vi.fn();
        createRunner(count(10), onEvent, { speed: 1, autoplay: true });
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(1);
    });

    it('caps a frame at maxBatchPerFrame', () => {
        const onEvent = vi.fn();
        createRunner(count(1000), onEvent, { speed: 1_000_000, maxBatchPerFrame: 7, autoplay: true });
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(7);
    });

    it('finishes: status done, onFinish called once, no more frames requested', () => {
        const onFinish = vi.fn();
        const runner = createRunner(count(3), vi.fn(), { autoplay: true, onFinish });
        raf.flush();
        expect(runner.getStatus()).toBe(AlgoStatus.done);
        expect(runner.isRunning()).toBe(false);
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(raf.pending()).toBe(0);
    });

    it('pause stops delivery and resume continues from the same point', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(10), onEvent, { speed: 120 }); // 2 per frame
        runner.play();
        raf.frame();
        runner.pause();
        expect(runner.getStatus()).toBe(AlgoStatus.paused);
        raf.flush();
        expect(onEvent).toHaveBeenCalledTimes(2);

        runner.play();
        raf.flush();
        expect(onEvent.mock.calls.map(([e]) => e)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('play twice does not double-schedule frames', () => {
        const runner = createRunner(count(10), vi.fn());
        runner.play();
        runner.play();
        expect(raf.pending()).toBe(1);
    });

    it('pause before play is a no-op', () => {
        const runner = createRunner(count(3), vi.fn());
        runner.pause();
        expect(runner.getStatus()).toBe(AlgoStatus.initial);
    });

    it('step delivers exactly one event and leaves the runner paused', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(3), onEvent);
        const res = runner.step();
        expect(res).toEqual({ value: 0, done: false });
        expect(onEvent).toHaveBeenCalledWith(0);
        expect(runner.getStatus()).toBe(AlgoStatus.paused);
    });

    it('step past the last event marks the runner done', () => {
        const onFinish = vi.fn();
        const runner = createRunner(count(1), vi.fn(), { onFinish });
        runner.step();
        expect(runner.step().done).toBe(true);
        expect(runner.getStatus()).toBe(AlgoStatus.done);
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('step while playing pauses playback', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(10), onEvent);
        runner.play();
        runner.step();
        raf.flush();
        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(runner.isRunning()).toBe(false);
    });

    it('skipToEnd drains everything synchronously', () => {
        const onEvent = vi.fn();
        const onFinish = vi.fn();
        const runner = createRunner(count(50), onEvent, { onFinish });
        runner.play();
        runner.skipToEnd();
        expect(onEvent).toHaveBeenCalledTimes(50);
        expect(runner.getStatus()).toBe(AlgoStatus.done);
        expect(onFinish).toHaveBeenCalledTimes(1);
        raf.flush();
        expect(onEvent).toHaveBeenCalledTimes(50);
    });

    it('setSpeed takes effect on the next frame and floors at 1', () => {
        const onEvent = vi.fn();
        const runner = createRunner(count(100), onEvent, { speed: 60, autoplay: true });
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(1);
        runner.setSpeed(600);
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(11);
        runner.setSpeed(0);
        raf.frame();
        expect(onEvent).toHaveBeenCalledTimes(12);
    });

    // The controller's status comes only from these reports, so every transition must be reported,
    // including the run finishing on its own inside a frame
    describe('onStatusChange', () => {
        const setup = (n: number) => {
            const onStatusChange = vi.fn();
            const runner = createRunner(count(n), vi.fn(), { onStatusChange });
            const reported = () => onStatusChange.mock.calls.map(([s]) => s);
            return { runner, reported };
        };

        it('is not called for the initial status', () => {
            const { reported } = setup(3);
            expect(reported()).toEqual([]);
        });

        it('reports play, pause, and finishing on its own', () => {
            const { runner, reported } = setup(3);
            runner.play();
            runner.pause();
            runner.play();
            raf.flush();
            expect(reported()).toEqual([AlgoStatus.running, AlgoStatus.paused, AlgoStatus.running, AlgoStatus.done]);
        });

        it('reports each change once: repeated steps stay one "paused"', () => {
            const { runner, reported } = setup(2);
            runner.step();
            runner.step();
            runner.step(); // generator exhausted
            expect(reported()).toEqual([AlgoStatus.paused, AlgoStatus.done]);
        });

        it('reports done on skipToEnd, including from a running run', () => {
            const { runner, reported } = setup(5);
            runner.play();
            runner.skipToEnd();
            expect(reported()).toEqual([AlgoStatus.running, AlgoStatus.done]);
        });

        it('stays silent for no-op controls', () => {
            const { runner, reported } = setup(3);
            runner.pause(); // not running
            runner.play();
            runner.play(); // already running
            expect(reported()).toEqual([AlgoStatus.running]);
        });

        // getStatus and the reports must always agree
        it('reports match getStatus after every transition', () => {
            const onStatusChange = vi.fn();
            const runner = createRunner(count(3), vi.fn(), {
                onStatusChange: (s: AlgoStatus) => onStatusChange(s, runner.getStatus()),
            });
            runner.play();
            runner.pause();
            runner.step();
            runner.skipToEnd();
            for (const [reported, actual] of onStatusChange.mock.calls) expect(reported).toBe(actual);
        });
    });
});
