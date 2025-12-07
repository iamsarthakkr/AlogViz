'use client';

import { useCallback, useRef, useState } from 'react';

import { createRunner, RunnerApi } from './runner';
import { getGridSnapshot } from './utils';
import { MazeGenerator, MazeGeneratorEvent } from '@/types/mazeGenerator';
import { useGridStore } from '@features/store';
import { CellKind } from '@/types/grid';

export type MazeGeneratorApi = {
    generate: (key: string) => void;
};

export type MazeGeneratorRegistry = Record<string, MazeGenerator>;

type Options = {
    speed?: number; // EPS
};

export function useMazeGenerator(registry: MazeGeneratorRegistry, opts: Options = {}): MazeGeneratorApi {
    const [speed] = useState<number>(opts.speed ?? 120);
    const runnerRef = useRef<RunnerApi<MazeGeneratorEvent>>(null);

    const generateMaze = useCallback(
        (key: string) => {
            const algo = registry[key];
            if (!algo) return null;

            const snap = getGridSnapshot();
            if (!snap) return null;

            if (runnerRef.current) {
                runnerRef.current.pause();
            }

            const gridApi = useGridStore.getState();

            // block updates to grid
            gridApi.setGridLock(true);

            // remove start and goal
            const start = gridApi.start;
            const goal = gridApi.goal;

            gridApi.setStart(-1, -1);
            gridApi.setGoal(-1, -1);

            const gen = algo(snap.rows, snap.cols);

            runnerRef.current = createRunner(
                gen,
                (event) => {
                    // handle events
                    switch (event.type) {
                        case 'fill-wall':
                            gridApi.fillWalls();
                            break;
                        case 'clear-wall':
                            gridApi.clearWalls();
                            break;
                        case 'carve':
                            gridApi.setCell(event.at.r, event.at.c, CellKind.empty);
                            break;
                        case 'wall':
                            gridApi.setCell(event.at.r, event.at.c, CellKind.wall);
                            break;
                        case 'done':
                            // set back start and goal
                            gridApi.setStart(start.r, start.c);
                            gridApi.setGoal(goal.r, goal.c);
                            // enable updates on grid
                            gridApi.setGridLock(false);
                            gridApi.refresh();
                            break;
                        default:
                            break;
                    }
                },
                {
                    speed: speed,
                },
            );
            runnerRef.current.play();
        },
        [speed, registry],
    );

    return {
        generate: generateMaze,
    };
}
