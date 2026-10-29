// Authored by - Sarthak Kumar
//
// PlaybackControls: Visualize, Pause/Step, Clear path and the speed preset. Receives the algorithm
// controller owned by ui/Grid.tsx. Pure UI: button state comes from the controller's status, and
// every click calls its public API (play/pause/step/clear). The speed preset is written to
// useSettingsStore only; the controller applies it from there.

import { Dropdown } from '@/components/Dropdown';
import { AlgoController } from '@/features/animations';
import { availableSpeeds } from '@/utils/settings';
import { useSettingsStore } from '@/features/store';
import { SpeedPreset } from '@/types/settings';
import { AlgoStatus } from '@/types/algo';

type Props = {
    algo: AlgoController;
};

// phones: one row of equal-width touch targets (min 44px tall); desktop (xl): fixed widths, which the page layout relies on (see .page in index.css)
const btn = 'min-h-11 xl:min-h-0 px-2 xl:px-3 py-2 rounded-md font-semibold text-white text-sm';
const secondary = `${btn} bg-primary hover:text-secondary disabled:cursor-not-allowed`;

export const PlaybackControls = ({ algo }: Props) => {
    const speed = useSettingsStore((s) => s.speed);

    const onSpeedChange = (preset: string) => {
        const api = useSettingsStore.getState();
        api.setSpeed(preset as SpeedPreset);
    };

    return (
        <div className="flex w-full gap-2 xl:w-auto">
            <button
                className={`${btn} flex-[1.4] xl:flex-none xl:w-30 bg-indigo-600 disabled:bg-indigo-900 disabled:cursor-not-allowed hover:brightness-95`}
                onClick={algo.play}
                title="Visualize"
                disabled={algo.status === AlgoStatus.running}
            >
                Visualize
            </button>
            {algo.status === AlgoStatus.running ? (
                <button className={`${secondary} flex-1 xl:flex-none xl:w-20`} onClick={algo.pause} title="Pause">
                    Pause
                </button>
            ) : (
                <button className={`${secondary} flex-1 xl:flex-none xl:w-20`} onClick={algo.step} title="Step">
                    Step
                </button>
            )}

            {/* short label on phones; aria-label keeps one accessible name at every width */}
            <button
                className={`${secondary} flex-1 xl:flex-none xl:w-30 xl:ml-4`}
                onClick={algo.clear}
                title="Clear path"
                aria-label="Clear path"
                disabled={algo.status === AlgoStatus.running}
            >
                Clear<span className="hidden xl:inline">&nbsp;path</span>
            </button>
            {/* bottom bar on phones: open upward, right-aligned so the menu stays on screen;
                top bar on desktop: open downward */}
            <Dropdown
                title={
                    <>
                        <span className="hidden xl:inline">Speed: </span>
                        {speed}
                    </>
                }
                label={`Speed: ${speed}`}
                options={availableSpeeds}
                onSelect={onSpeedChange}
                className="flex-1 min-w-0 xl:flex-none xl:w-40 font-semibold d-dropdown-top d-dropdown-end xl:d-dropdown-bottom"
                menuClassName="mb-2 xl:mb-0 xl:mt-2"
            />
        </div>
    );
};
