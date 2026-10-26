// Authored by - Sarthak Kumar
//
// Grid: top-level page composition (the whole app is this one view). Holds the single gridRef
// (CanvasGridHandle) that both Toolbar and CanvasGrid share — the only wiring between
// the toolbar's controls and the canvas.

import { useRef } from 'react';
import { CanvasGrid, CanvasGridHandle } from '@/features/CanvasGrid';
import { Toolbar } from '@/features/Toolbar';
import { useResponsiveGrid } from '@/features/hooks/useResponsiveGrid';

export default function GridPage() {
    const gridRef = useRef<CanvasGridHandle>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    useResponsiveGrid(boxRef);

    return (
        <div className="w-full h-dvh flex flex-col">
            <Toolbar ctx={gridRef} className="mb-5" />
            <div ref={boxRef} className="flex-1 min-h-0 overflow-auto flex items-center-safe justify-center-safe">
                <CanvasGrid ref={gridRef} />
            </div>
        </div>
    );
}
