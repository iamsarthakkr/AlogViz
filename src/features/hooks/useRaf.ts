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
    useEffect(() => () => cancelAnimationFrame(rafId.current), []);
    return schedule;
};
