'use client';

import { useCallback, useRef, useState } from 'react';

import { createRunner, RunnerApi } from './runner';
import { getGridSnapshot } from './utils';
import { MazeGenerator, MazeGeneratorEvent } from '@/types/mazeGenerator';
import { useGridStore } from '@features/store';
import { CellKind } from '@/types/grid';
import { Callback } from '@/types/common';

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
    const clearnupRef = useRef<Callback>(null);

    const generateMaze = useCallback(
        (key: string) => {
            const algo = registry[key];
            if (!algo) return null;

            if (runnerRef.current) {
                runnerRef.current.pause();
                runnerRef.current = null;
            }

            if (clearnupRef.current) {
                clearnupRef.current();
                clearnupRef.current = null;
            }

            const snap = getGridSnapshot();
            if (!snap) return null;

            const gridApi = useGridStore.getState();
            const start = { ...gridApi.start };
            const goal = { ...gridApi.goal };

            // block updates to grid
            gridApi.setGridLock(true);
            // remove start and goal
            gridApi.setStart(-1, -1);
            gridApi.setGoal(-1, -1);

            clearnupRef.current = () => {
                // set back start and goal
                useGridStore.getState().setStart(start.r, start.c);
                useGridStore.getState().setGoal(goal.r, goal.c);
                // enable updates on grid
                useGridStore.getState().setGridLock(false);
                useGridStore.getState().refresh();
            };

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
                            if (clearnupRef.current) {
                                clearnupRef.current();
                                clearnupRef.current = null;
                            }
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
