import { vi } from 'vitest';

// Manual requestAnimationFrame: nothing runs until the test advances frames explicitly,
// which makes runner/animation timing deterministic.
export function installFakeRaf() {
    let nextId = 1;
    let queue = new Map<number, FrameRequestCallback>();

    vi.stubGlobal(
        'requestAnimationFrame',
        vi.fn((cb: FrameRequestCallback) => {
            const id = nextId++;
            queue.set(id, cb);
            return id;
        }),
    );
    vi.stubGlobal(
        'cancelAnimationFrame',
        vi.fn((id: number) => {
            queue.delete(id);
        }),
    );

    // Runs every callback that was queued before this frame started, like a browser frame
    const frame = () => {
        const current = queue;
        queue = new Map();
        for (const cb of current.values()) cb(performance.now());
    };

    const flush = (maxFrames = 10_000) => {
        let frames = 0;
        while (queue.size > 0) {
            if (++frames > maxFrames) throw new Error(`rAF queue did not drain within ${maxFrames} frames`);
            frame();
        }
        return frames;
    };

    return { frame, flush, pending: () => queue.size };
}
