// Authored by - Sarthak Kumar
//
// Grid: top-level page composition (the whole app is this one view).
// - Owns the single algorithm controller and maze generator, and passes them down as props:
//   every control that drives a run must share one instance (two hook calls = two runners)
// - The CanvasGrid ref goes only to the controller (which paints the overlay) and CanvasGrid;
//   the controls never touch the canvas directly
// - Layout is the .page grid in index.css: each piece is rendered once and placed by its named
//   grid area (header, grid, stats, legend, controls); only the area map changes per breakpoint
// - The grid's box is the `grid` area inside a padded <main>; the box itself has no padding,
//   because useResponsiveGrid measures it and load/resize must see the same size

import { useRef } from 'react';
import { CanvasGrid, CanvasGridHandle } from '@/features/CanvasGrid';
import { PlaybackControls, Toolbar } from '@/features/Toolbar';
import { useResponsiveGrid } from '@/features/hooks/useResponsiveGrid';
import { useAlgoController, useMazeGenerator } from '@/features/animations';
import { speedToEPS } from '@/utils/settings';
import { mazes } from '@/features/mazes';
import { algorithms } from '@/features/algo';
import { useSettingsStore } from '@/features/store';
import { Stats } from './Stats';
import { Legend } from './Legend';

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
        <div className="page">
            <Toolbar className="[grid-area:header]" algo={algoController} maze={mazeGenerator} />

            <main className="[grid-area:grid] min-h-0 min-w-0 p-4 flex">
                <div
                    ref={boxRef}
                    className="flex-1 min-h-0 min-w-0 overflow-auto flex items-center-safe justify-center-safe"
                >
                    <CanvasGrid ref={gridRef} />
                </div>
            </main>

            <Stats className="[grid-area:stats] p-4" />
            <Legend className="[grid-area:legend] p-4" />

            <div className="[grid-area:controls] bg-primary flex items-center justify-end gap-2 px-4 py-2">
                <PlaybackControls algo={algoController} />
            </div>
        </div>
    );
}
