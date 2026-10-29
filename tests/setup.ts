import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { useGridStore, useSettingsStore } from '@/features/store';
import { createMockCtx } from './helpers/canvas';

// jsdom has no canvas implementation: getContext() returns null and logs "not implemented".
// Every canvas gets its own recording context so painters/components can be asserted on.
const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    let ctx = contexts.get(this);
    if (!ctx) {
        ctx = createMockCtx();
        contexts.set(this, ctx);
    }
    return ctx;
} as unknown as typeof HTMLCanvasElement.prototype.getContext;

// A real canvas wipes its pixels whenever width or height is assigned. Record that as a clearRect on
// the mock context, so tests can see when resizing a canvas erases what was painted on it.
for (const dimension of ['width', 'height'] as const) {
    const native = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, dimension)!;
    Object.defineProperty(HTMLCanvasElement.prototype, dimension, {
        configurable: true,
        get(this: HTMLCanvasElement) {
            return native.get!.call(this);
        },
        set(this: HTMLCanvasElement, value: number) {
            native.set!.call(this, value);
            this.getContext('2d')!.clearRect(0, 0, this.width, this.height);
        },
    });
}

// jsdom has no ResizeObserver; this no-op lets the page mount. Tests that need resizes
// use installFakeResizeObserver() from helpers/resize.ts instead.
globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// jsdom has no showModal/close. Mirror what the browser does with the `open` attribute and the
// `close` event (which is what components listen to), without the top layer or focus trapping.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
};

// Both stores are module singletons, so state would otherwise leak between tests.
beforeEach(() => {
    // jsdom's localStorage lives for the whole file; clear it so "first visit" state can't leak
    localStorage.clear();
    // not reset(): it bumps gridVersion, which would carry over from test to test
    useGridStore.setState(useGridStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
});

afterEach(() => {
    cleanup();
});
