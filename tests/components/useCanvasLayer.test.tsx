import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useCanvasLayer } from '@/components/useCanvasLayer';

describe('useCanvasLayer', () => {
    // callers put getCtx in effect deps; a new function each render would re-run those effects
    // (and redraw) on every render
    it('returns the same getCtx across re-renders', () => {
        const seen: unknown[] = [];
        const Harness = ({ size }: { size: number }) => {
            const { ref, getCtx } = useCanvasLayer(1, 1, size);
            seen.push(getCtx);
            return <canvas ref={ref} />;
        };

        const { rerender } = render(<Harness size={10} />);
        rerender(<Harness size={20} />);
        expect(seen).toHaveLength(2);
        expect(seen[1]).toBe(seen[0]);
    });
});
