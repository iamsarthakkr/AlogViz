import { Coord } from '@/types/grid';
import { MazeGenerator } from '@/types/mazeGenerator';
import { shuffle } from '@features/algo/utils';

const wall_prob = 0.35;
export const randomGenerator: MazeGenerator = function*(rows, cols) {
    yield { type: 'clear-wall' };

    const cells: Coord[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r % 2 === 1 && c % 2 === 1) continue;
            cells.push({ r, c });
        }
    }

    shuffle(cells);

    for (const cell of cells) {
        const prob = Math.random();
        if (prob <= wall_prob) {
            yield { type: 'wall', at: cell };
        }
    }
    yield { type: 'done' };
};
