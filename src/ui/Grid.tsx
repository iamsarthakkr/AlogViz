// Authored by - Sarthak Kumar
//
// Grid: top-level page composition (the whole app is this one view).
// - Owns the single algorithm controller and maze generator, and passes them down as props:
//   every control that drives a run must share one instance (two hook calls = two runners)
// - The CanvasGrid ref goes only to the controller (which paints the overlay) and CanvasGrid;
//   the controls never touch the canvas directly
// - The grid sits in a box sized by the page (flex-1 min-h-0) that useResponsiveGrid measures

import { useRef } from 'react';
import { CanvasGrid, CanvasGridHandle } from '@/features/CanvasGrid';
import { Toolbar } from '@/features/Toolbar';
import { useResponsiveGrid } from '@/features/hooks/useResponsiveGrid';
import { useAlgoController, useMazeGenerator } from '@/features/animations';
import { speedToEPS } from '@/utils/settings';
import { mazes } from '@/features/mazes';
import { algorithms } from '@/features/algo';
import { useSettingsStore } from '@/features/store';

export default function GridPage() {
    const algoKey = useSettingsStore((s) => s.algoKey);
    const speed = useSettingsStore((s) => s.speed);

    const gridRef = useRef<CanvasGridHandle>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const algoController = useAlgoController(gridRef, algorithms, {
        initialAlgo: algoKey,
        initialSpeed: speedToEPS[speed],
        animatePath: true,
    });
    const mazeGenerator = useMazeGenerator(mazes);

    useResponsiveGrid(boxRef);

    return (
        <div className="w-full h-dvh flex flex-col">
            <Toolbar className="mb-5" algo={algoController} maze={mazeGenerator} />
            <div ref={boxRef} className="flex-1 min-h-0 overflow-auto flex items-center-safe justify-center-safe">
                <CanvasGrid ref={gridRef} />
            </div>
        </div>
    );
}
