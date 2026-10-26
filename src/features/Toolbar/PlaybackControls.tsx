// Authored by - Sarthak Kumar
//
// PlaybackControls: Visualize, Pause/Step, Clear path and the speed preset. Receives the algorithm
// controller owned by ui/Grid.tsx. Pure UI: button state comes from the controller's status, and
// every click calls its public API (play/pause/step/clear/setSpeed).

import { Dropdown } from '@/components/Dropdown';
import { AlgoController } from '@/features/animations';
import { availableSpeeds, speedToEPS } from '@/utils/settings';
import { useSettingsStore } from '@/features/store';
import { SpeedPreset } from '@/types/settings';

type Props = {
    algo: AlgoController;
};

export const PlaybackControls = ({ algo }: Props) => {
    const speed = useSettingsStore((s) => s.speed);

    const onSpeedChange = (preset: string) => {
        const api = useSettingsStore.getState();
        api.setSpeed(preset as SpeedPreset);
        algo.setSpeed(speedToEPS[preset as SpeedPreset]);
    };

    return (
        <>
            <div className="flex  items-center justify-center gap-2">
                <button
                    className="px-3 py-2 w-30 rounded-md font-semibold bg-indigo-600 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white text-sm hover:brightness-95"
                    onClick={algo.play}
                    title="Visualize"
                    disabled={algo.status === 'running'}
                >
                    Visualize
                </button>
                {algo.status === 'running' ? (
                    <button
                        className="px-3 py-2 w-20 rounded-md font-semibold border bg-primary border-none text-white text-sm hover:text-secondary"
                        onClick={algo.pause}
                        title="Pause"
                    >
                        Pause
                    </button>
                ) : (
                    <button
                        className="px-3 py-2 w-20 font-semibold rounded-md border bg-primary border-none text-white text-sm hover:text-secondary"
                        onClick={algo.step}
                        title="Step"
                    >
                        Step
                    </button>
                )}
            </div>

            <div className="flex flex-1 font-semibold items-center justify-center gap-2">
                <button
                    className="px-3 py-2 w-30 rounded-md font-semibold border bg-primary border-none text-white text-sm hover:text-secondary"
                    onClick={algo.clear}
                    title="Clear path"
                    disabled={algo.status === 'running'}
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
        </>
    );
};
