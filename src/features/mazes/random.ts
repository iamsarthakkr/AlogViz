import { MazeGenerator } from '@/types/mazeGenerator';

const limit = 0.4;
export const randomGenerator: MazeGenerator = function*(rows, cols) {
    yield { type: 'clear-wall' };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rnd = Math.random();
            if (rnd < limit) {
                yield { type: 'wall', at: { r, c } };
            }
        }
    }
    yield { type: 'done' };
};
