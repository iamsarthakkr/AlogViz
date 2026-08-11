// Authored by - Sarthak Kumar
//
// Grid: top-level page composition for the /grid route. Holds the single gridRef
// (CanvasGridHandle) that both Toolbar and CanvasGrid share — the only wiring between
// the toolbar's controls and the canvas.
'use client';

import React, { useRef } from 'react';
import { CanvasGrid, CanvasGridHandle } from '@features/CanvasGrid';
import { Toolbar } from '@features/Toolbar';

export default function GridPage() {
    const gridRef = useRef<CanvasGridHandle>(null);

    return (
        <div className="w-full flex flex-col justify-center items-center">
            <Toolbar ctx={gridRef} className="mb-5" />
            <CanvasGrid ref={gridRef} />
        </div>
    );
}
