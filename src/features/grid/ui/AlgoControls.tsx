'use client';

import React from 'react';
import { CanvasGridHandle } from './CanvasGrid';
import { useAlgoController } from '../animations/useAlgoController';
import { useSettingsStore } from '../store/useSettingsStore';
import { speedToEPS } from '../utils';
import { SpeedPreset } from '../types';
import { bfs } from '../algo/bfs';

type Props = {
    ctx: React.RefObject<CanvasGridHandle | null>;
};

const registry = { bfs };

const AlgoControls = ({ ctx }: Props) => {
    const { algoKey, speed, mazeGeneratorKey, setAlgoKey, setSpeed, setMazeGeneratorKey } = useSettingsStore((s) => s);

    const algoController = useAlgoController(ctx, registry);

    const onAlgoChange = (k: string) => {
        setAlgoKey(k);
        algoController.setAlgorithm(k);
    };

    const onSpeedChange = (preset: SpeedPreset) => {
        setSpeed(preset);
        algoController.setSpeed(speedToEPS[preset]);
    };
    return (
        <div className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-3">
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Algorithm</label>
                <select
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={algoKey ?? algoController.currentAlgo}
                    onChange={(e) => onAlgoChange(e.target.value)}
                >
                    <option key={1} value={'bfs'}>
                        BFS
                    </option>
                    {/* {algorithms.map((k) => ( */}
                    {/*     <option key={k} value={k}> */}
                    {/*         {k.toUpperCase()} */}
                    {/*     </option> */}
                    {/* ))} */}
                </select>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Speed</label>
                <select
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={speed}
                    onChange={(e) => onSpeedChange(e.target.value as SpeedPreset)}
                >
                    <option value="slow">Slow</option>
                    <option value="medium">Medium</option>
                    <option value="fast">Fast</option>
                </select>
            </div>

            {/* Maze generator (placeholder) */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Maze</label>
                <select
                    className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={mazeGeneratorKey ?? ''}
                    onChange={(e) => setMazeGeneratorKey(e.target.value || '')}
                >
                    <option value="">— Select —</option>
                    <option value="random">Random walls</option>
                    <option value="recursive-division" disabled>
                        Recursive Division (soon)
                    </option>
                    <option value="prims" disabled>
                        Prim’s (soon)
                    </option>
                </select>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Transport */}
            <div className="flex items-center gap-2">
                <button
                    className="px-2 py-1 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                    onClick={algoController.step}
                    title="Step"
                >
                    Step
                </button>
                {algoController.status === 'running' ? (
                    <button
                        className="px-2 py-1 rounded-md bg-amber-500 text-white text-sm hover:brightness-95"
                        onClick={algoController.pause}
                        title="Pause"
                    >
                        Pause
                    </button>
                ) : (
                    <button
                        className="px-2 py-1 rounded-md bg-indigo-600 text-white text-sm hover:brightness-95"
                        onClick={algoController.play}
                        title="Play"
                    >
                        Play
                    </button>
                )}
                <button
                    className="px-2 py-1 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                    onClick={algoController.skipToEnd}
                    title="Skip to end"
                >
                    Skip
                </button>
            </div>
        </div>
    );
};

export default AlgoControls;
