import { Coord } from '@/types/grid';
import { MazeGenerator } from '@/types/mazeGenerator';
import { random, second_neighbors4, shuffle } from '@features/algo/utils';

// depth first backtracking
export const floodFill: MazeGenerator = function*(rows, cols) {
    yield { type: 'fill-wall' };

    const id = (s: Coord) => s.r * cols + s.c;
    const inb = (s: Coord) => s.r >= 0 && s.r < rows && s.c >= 0 && s.c < cols;

    const stack: Coord[] = [];
    const seen = new Uint8Array(rows * cols);

    const start: Coord = {
        r: (random(0, Math.floor(rows / 2)) | 0) * 2 + 1,
        c: (random(0, Math.floor(cols / 2)) | 0) * 2 + 1,
    };

    stack.push(start);
    seen[id(start)] = 1;
    yield { type: 'carve', at: start };

    while (stack.length > 0) {
        const u = stack[stack.length - 1];

        let neighs = second_neighbors4(u);
        shuffle(neighs);
        neighs = neighs.filter((v) => {
            return inb(v) && !seen[id(v)];
        });

        if (neighs.length === 0) {
            stack.pop();
            continue;
        }

        const to = neighs[random(0, neighs.length - 1)];
        const to_id = id(to);

        const mid: Coord = {
            r: (u.r + to.r) / 2,
            c: (u.c + to.c) / 2,
        };

        yield { type: 'carve', at: mid };
        yield { type: 'carve', at: to };

        seen[to_id] = 1;
        stack.push(to);
    }

    yield { type: 'done' };
};
