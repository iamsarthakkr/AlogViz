import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRaf } from '@/features/hooks/useRaf';
import { installFakeRaf } from '../../helpers/raf';

describe('useRaf', () => {
    let raf: ReturnType<typeof installFakeRaf>;
    beforeEach(() => {
        raf = installFakeRaf();
    });

    it('runs a scheduled job on the next frame', () => {
        const { result } = renderHook(() => useRaf());
        const job = vi.fn();
        result.current(job);
        expect(job).not.toHaveBeenCalled();
        raf.frame();
        expect(job).toHaveBeenCalledTimes(1);
    });

    it('coalesces several schedules in one frame into the latest job', () => {
        const { result } = renderHook(() => useRaf());
        const first = vi.fn();
        const last = vi.fn();
        result.current(first);
        result.current(last);
        expect(raf.pending()).toBe(1);
        raf.frame();
        expect(first).not.toHaveBeenCalled();
        expect(last).toHaveBeenCalledTimes(1);
    });

    it('can schedule again after a frame has run', () => {
        const { result } = renderHook(() => useRaf());
        const job = vi.fn();
        result.current(job);
        raf.frame();
        result.current(job);
        raf.frame();
        expect(job).toHaveBeenCalledTimes(2);
    });

    it('cancels the pending frame on unmount', () => {
        const { result, unmount } = renderHook(() => useRaf());
        const job = vi.fn();
        result.current(job);
        unmount();
        raf.flush();
        expect(job).not.toHaveBeenCalled();
    });

    // Regression for the Strict Mode bug fixed in e98cb17: cleanup must reset the pending flag,
    // otherwise the remounted effect sees "pending" forever and never draws.
    it('still schedules after a Strict Mode style unmount/remount', () => {
        const { result, rerender } = renderHook(() => useRaf(), { reactStrictMode: true });
        rerender();
        const job = vi.fn();
        result.current(job);
        raf.flush();
        expect(job).toHaveBeenCalledTimes(1);
    });
});
