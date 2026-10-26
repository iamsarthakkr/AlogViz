import { vi } from 'vitest';

// Manual ResizeObserver: callbacks run only when the test calls resize(), with a fake contentRect.
// jsdom has no layout, so this is the only way to simulate the observed box changing size.
export function installFakeResizeObserver() {
    const observing = new Set<FakeResizeObserver>();

    class FakeResizeObserver {
        callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
            this.callback = callback;
        }
        observe() {
            observing.add(this);
        }
        unobserve() {
            observing.delete(this);
        }
        disconnect() {
            observing.delete(this);
        }
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    const resize = (width: number, height: number) => {
        const entry = { contentRect: { width, height } } as ResizeObserverEntry;
        for (const observer of [...observing]) {
            observer.callback([entry], observer as unknown as ResizeObserver);
        }
    };

    return { resize, live: () => observing.size };
}
