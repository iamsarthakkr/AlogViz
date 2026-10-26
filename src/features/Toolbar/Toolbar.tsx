// Authored by - Sarthak Kumar
//
// Toolbar: the page header — title + AlgoPickers. Receives the algorithm controller and maze
// generator owned by ui/Grid.tsx and passes them to the pickers. PlaybackControls are not in here:
// the page places them in their own grid area (top bar on desktop, bottom bar on phones).

import { AlgoController, MazeGeneratorApi } from '@/features/animations';
import { AlgoPickers } from './AlgoPickers';

type Props = {
    className?: string;
    algo: AlgoController;
    maze: MazeGeneratorApi;
};

export const Toolbar = ({ className, algo, maze }: Props) => {
    return (
        <header className={`${className} bg-primary flex items-center gap-6 px-6`}>
            <div className="py-3 text-white text-2xl font-semibold tracking-tight">AlgoViz</div>
            <div className="flex items-center gap-2">
                <AlgoPickers algo={algo} maze={maze} />
            </div>
        </header>
    );
};
