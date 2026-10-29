// Authored by - Sarthak Kumar
//
// Toolbar: the page header — title, the info button, then AlgoPickers. Receives the algorithm
// controller and maze generator owned by ui/Grid.tsx and passes them to the pickers.
// - The info button only calls toggleModal: the dialog and its open state live in the page
//   (ui/InfoModal, useInfoModal), since the dialog isn't part of the header
// - PlaybackControls are not in here: the page places them in their own grid area (top bar on
//   desktop, bottom bar on phones)

import { AlgoController, MazeGeneratorApi } from '@/features/animations';
import { AlgoPickers } from './AlgoPickers';
import { InfoIcon } from '@/icons/InfoIcon';
import { Callback } from '@/types/common';

type Props = {
    className?: string;
    algo: AlgoController;
    maze: MazeGeneratorApi;
    toggleModal: Callback;
};

export const Toolbar = ({ className = '', algo, maze, toggleModal }: Props) => {
    return (
        <header className={`${className} bg-primary flex items-center gap-3 px-4 xl:gap-6 xl:px-6`}>
            <div className="shrink-0 py-3 text-white text-lg xl:text-2xl font-semibold tracking-tight">AlgoViz</div>
            <button
                className="shrink-0 size-11 xl:size-9 rounded-full grid place-items-center text-white hover:bg-white/10"
                aria-label="About AlgoViz"
                aria-haspopup="dialog"
                onClick={toggleModal}
            >
                <InfoIcon />
            </button>
            <div className="flex flex-1 min-w-0 items-center gap-2 xl:flex-none">
                <AlgoPickers algo={algo} maze={maze} />
            </div>
        </header>
    );
};
