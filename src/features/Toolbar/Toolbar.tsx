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

export const Toolbar = ({ className = '', algo, maze }: Props) => {
    return (
        <header className={`${className} bg-primary flex items-center gap-3 px-4 xl:gap-6 xl:px-6`}>
            <div className="shrink-0 py-3 text-white text-lg xl:text-2xl font-semibold tracking-tight">AlgoViz</div>
            <div className="flex flex-1 min-w-0 items-center gap-2 xl:flex-none">
                <AlgoPickers algo={algo} maze={maze} />
            </div>
        </header>
    );
};
