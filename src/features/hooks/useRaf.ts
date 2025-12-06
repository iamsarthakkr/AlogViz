import { useCallback, useEffect, useRef } from 'react';

// hook to schedule animation frames
export const useRaf = () => {
    const rafId = useRef(0);
    const schedule = useCallback((job: () => void) => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
            rafId.current = 0;
            job();
        });
    }, []);
    useEffect(() => () => cancelAnimationFrame(rafId.current), []);
    return schedule;
};
