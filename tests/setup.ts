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

// Both stores are module singletons, so state would otherwise leak between tests.
beforeEach(() => {
    // not reset(): it bumps gridVersion, which would carry over from test to test
    useGridStore.setState(useGridStore.getInitialState(), true);
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
});

afterEach(() => {
    cleanup();
});
