'use client';

import React, { useCallback, useRef } from 'react';
import CanvasGrid, { CanvasGridHandle } from '../ui/CanvasGrid';
import { useAlgoRunner } from '../animations/useAlgoRunner';
import { bfs } from '../algo/bfs';

const registry = { bfs };

export default function GridPage() {
    const gridRef = useRef<CanvasGridHandle>(null);
    const runner = useAlgoRunner(gridRef, registry);

    const onRun = useCallback(() => {
        runner.setAlgorithm('bfs');
        runner.play();
    }, [runner]);

    return (
        <div className="flex justify-center items-center p-2">
            <CanvasGrid ref={gridRef} />
            <button onClick={onRun}>Run BFS</button>
        </div>
    );
}
