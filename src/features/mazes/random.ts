import { Coord } from '@/types/grid';
import { MazeGenerator } from '@/types/mazeGenerator';
import { shuffle } from '@features/algo/utils';

const limit = 0.4;
export const randomGenerator: MazeGenerator = function*(rows, cols) {
    yield { type: 'clear-wall' };

    const cells: Coord[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells.push({ r, c });
        }
    }

    shuffle(cells);

    for (const cell of cells) {
        const rnd = Math.random();
        if (rnd < limit) {
            yield { type: 'wall', at: cell };
        }
    }
    yield { type: 'done' };
};
