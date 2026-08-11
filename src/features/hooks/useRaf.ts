// Authored by - Sarthak Kumar
//
// useRaf: coalesces multiple schedule() calls within one frame into a single rAF job.
// pendingRef gates duplicate rAF requests; cleanup must reset it too (not just cancel
// the frame) so React Strict Mode's dev-only double-effect-invoke doesn't leave it
// permanently stuck true (see ARCHITECTURE.md / ROADMAP.md High #6 for the bug this fixed).

import { Callback } from '@/types/common';
import { useCallback, useEffect, useRef } from 'react';

// hook to schedule animation frames
export const useRaf = () => {
    const pendingRef = useRef(false);
    const rafId = useRef(0);
    const callbackRef = useRef<Callback | null>(null);

    const schedule = useCallback((job: Callback) => {
        callbackRef.current = job;
        if (pendingRef.current) return;

        pendingRef.current = true;
        rafId.current = requestAnimationFrame(() => {
            rafId.current = 0;
            pendingRef.current = false;
            if (callbackRef.current) callbackRef.current();
        });
    }, []);
    useEffect(
        () => () => {
            cancelAnimationFrame(rafId.current);
            pendingRef.current = false;
        },
        [],
    );
    return schedule;
};
