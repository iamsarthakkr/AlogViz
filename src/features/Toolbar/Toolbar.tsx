// Authored by - Sarthak Kumar
//
// Toolbar: top-level chrome bar — title + AlgoPickers + PlaybackControls. Receives the algorithm
// controller and maze generator owned by ui/Grid.tsx and passes them to the controls.

import { AlgoController, MazeGeneratorApi } from '@/features/animations';
import { AlgoPickers } from './AlgoPickers';
import { PlaybackControls } from './PlaybackControls';

type Props = {
    className?: string;
    algo: AlgoController;
    maze: MazeGeneratorApi;
};

export const Toolbar = ({ className, algo, maze }: Props) => {
    return (
        <div className={`${className} w-full bg-primary`}>
            <div className="px-10 w-full flex items-center gap-10">
                <div className="py-3 text-white text-2xl font-semibold tracking-tight">AlgoViz</div>
                <div className="w-full px-3 flex flex-1 items-center justify-between gap-3">
                    <div className="flex flex-1 items-center gap-2">
                        <AlgoPickers algo={algo} maze={maze} />
                    </div>

                    <PlaybackControls algo={algo} />
                </div>
            </div>
        </div>
    );
};
