// Authored by - Sarthak Kumar
//
// AlgoPickers: the algorithm and maze dropdowns. Receives the algorithm controller and maze
// generator owned by ui/Grid.tsx; the selected keys are mirrored in useSettingsStore for the labels.
// - Picking a maze clears the current path first, so the old path never shows under the new maze

import { Dropdown } from '@/components/Dropdown';
import { algoLabels } from '@/features/algo';
import { AlgoController, MazeGeneratorApi } from '@/features/animations';
import { mazesLabels } from '@/features/mazes';
import { useSettingsStore } from '@/features/store';

type Props = {
    algo: AlgoController;
    maze: MazeGeneratorApi;
};

export const AlgoPickers = ({ algo, maze }: Props) => {
    const algoKey = useSettingsStore((s) => s.algoKey);

    const onAlgoChange = (k: string) => {
        const api = useSettingsStore.getState();
        api.setAlgoKey(k);
        algo.setAlgorithm(k);
    };

    const onGenerateMaze = (key: string) => {
        const api = useSettingsStore.getState();
        algo.clear();

        maze.generate(key);
        api.setMazeGeneratorKey(key);
    };

    return (
        <>
            <Dropdown title={algoKey} options={algoLabels} onSelect={onAlgoChange} className="w-50 font-semibold" />
            <Dropdown
                title={'Mazes & Patterns'}
                options={mazesLabels}
                onSelect={onGenerateMaze}
                className="w-50 font-semibold"
            />
        </>
    );
};
