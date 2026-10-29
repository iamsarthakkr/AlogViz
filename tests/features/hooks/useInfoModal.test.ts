import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInfoModal } from '@/features/hooks/useInfoModal';

// "Seen" means the user dismissed the dialog once; it's remembered in localStorage.
// tests/setup.ts clears localStorage before each test, so each test starts as a first visit.
describe('useInfoModal', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // a fresh render of the hook, as on a page load
    const visit = () => renderHook(() => useInfoModal());

    it('is open on a first visit', () => {
        expect(visit().result.current.modalOpen).toBe(true);
    });

    it('closing marks it seen, so the next visit starts closed', () => {
        const first = visit();
        act(() => first.result.current.onModalClosed());
        expect(first.result.current.modalOpen).toBe(false);
        first.unmount();

        expect(visit().result.current.modalOpen).toBe(false);
    });

    // opening and closing by hand isn't a first visit any more, but toggling alone doesn't mark it
    // seen: only the dialog's own close does (Esc, X, backdrop all fire it)
    it('toggleModal opens and closes it without marking it seen', () => {
        const first = visit();
        act(() => first.result.current.toggleModal());
        expect(first.result.current.modalOpen).toBe(false);
        act(() => first.result.current.toggleModal());
        expect(first.result.current.modalOpen).toBe(true);
        first.unmount();

        expect(visit().result.current.modalOpen).toBe(true);
    });

    // The page re-renders every animation frame during a run, and this hook lives in it.
    // Reading storage belongs to the first render only.
    it('reads localStorage once, not on every render', () => {
        const getItem = vi.spyOn(Storage.prototype, 'getItem');
        const { rerender } = visit();
        const reads = getItem.mock.calls.length;
        rerender();
        rerender();
        expect(getItem).toHaveBeenCalledTimes(reads);
    });

    // Safari private mode and blocked site data make storage throw; the fallback is "show it again
    // next time", never a crash
    describe('when storage is unavailable', () => {
        const blockStorage = () => {
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new DOMException('blocked', 'SecurityError');
            });
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new DOMException('blocked', 'SecurityError');
            });
            vi.spyOn(console, 'error').mockImplementation(() => {});
        };

        it('opens as on a first visit', () => {
            blockStorage();
            expect(visit().result.current.modalOpen).toBe(true);
        });

        it('still closes', () => {
            blockStorage();
            const { result } = visit();
            act(() => result.current.onModalClosed());
            expect(result.current.modalOpen).toBe(false);
        });
    });
});
