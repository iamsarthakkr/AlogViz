'use client';

import React, { useCallback, useRef } from 'react';
import CanvasGrid, { CanvasGridHandle } from '../ui/CanvasGrid';
import { useAlgoRunner } from '../animations/useAlgoRunner';
import { bfs } from '../algo/bfs';

export default function GridPage() {
    const gridRef = useRef<CanvasGridHandle>(null);
    const runner = useAlgoRunner(gridRef);

    const onRun = useCallback(() => {
        runner.init(bfs, { speed: 220, animatePath: true });
        runner.play();
    }, [runner]);

    return (
        <div className="flex justify-center items-center p-2">
            <CanvasGrid ref={gridRef} />
            <button onClick={onRun}>Run BFS</button>
        </div>
    );
}
