'use client';

import React from 'react';
import { CanvasGridHandle } from '@features/CanvasGrid';
import { useAlgoController } from '@features/animations';
import { useSettingsStore } from '@features/store';
import { availableSpeeds, speedToEPS } from '@/utils/settings';
import { SpeedPreset } from '@/types/settings';
import { algoLabels, algorithms } from '@features/algo';
import { Dropdown } from '@/components/Dropdown';
import { mazes, mazesLabels } from '@features/mazes';
import { useMazeGenerator } from '@features/animations/useMazeGenerator';

type Props = {
    ctx: React.RefObject<CanvasGridHandle | null>;
};

export const AlgoControls = ({ ctx }: Props) => {
    const { algoKey, speed, mazeGeneratorKey, setAlgoKey, setSpeed, setMazeGeneratorKey } = useSettingsStore((s) => s);
    const algoController = useAlgoController(ctx, algorithms);
    const mazeGenerator = useMazeGenerator(mazes);

    const onAlgoChange = (k: string) => {
        setAlgoKey(k);
        algoController.setAlgorithm(k);
    };

    const onSpeedChange = (preset: string) => {
        setSpeed(preset as SpeedPreset);
        algoController.setSpeed(speedToEPS[preset as SpeedPreset]);
    };

    const onGenerateMaze = (key: string) => {
        algoController.clear();

        // call maze generator for key
        mazeGenerator.generate(key);
        setMazeGeneratorKey(key);
    };

    return (
        <div className="w-full px-3 flex flex-1 items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
                <Dropdown
                    title={algoKey ? algoKey : 'Algorithm'}
                    options={algoLabels}
                    onSelect={onAlgoChange}
                    className="w-50 font-semibold"
                />
                <Dropdown
                    title={'Mazes & Patterns'}
                    options={mazesLabels}
                    onSelect={onGenerateMaze}
                    className="w-50 font-semibold"
                />
            </div>

            <div className="flex  items-center justify-center gap-2">
                <button
                    className="px-3 py-2 w-30 rounded-md font-semibold bg-indigo-600 text-white text-sm hover:brightness-95"
                    onClick={algoController.play}
                    title="Visualize"
                    disabled={algoController.status === 'running'}
                >
                    Visualize
                </button>
                {algoController.status === 'running' ? (
                    <button
                        className="px-3 py-2 w-20 rounded-md font-semibold border bg-primary border-none text-white text-sm hover:text-secondary"
                        onClick={algoController.pause}
                        title="Pause"
                    >
                        Pause
                    </button>
                ) : (
                    <button
                        className="px-3 py-2 w-20 font-semibold rounded-md border bg-primary border-none text-white text-sm hover:text-secondary"
                        onClick={algoController.step}
                        title="Step"
                    >
                        Step
                    </button>
                )}
            </div>

            <div className="flex flex-1 font-semibold items-center justify-center gap-2">
                <button
                    className="px-3 py-2 w-30 rounded-md font-semibold border bg-primary border-none text-white text-sm hover:text-secondary"
                    onClick={algoController.clear}
                    title="Clear path"
                    disabled={algoController.status === 'running'}
                >
                    Clear path
                </button>
                <Dropdown
                    title={`Speed: ${speed}`}
                    options={availableSpeeds}
                    onSelect={onSpeedChange}
                    className="w-40 font-semibold"
                />
            </div>
        </div>
    );
};
