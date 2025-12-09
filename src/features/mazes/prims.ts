import { Coord } from '@/types/grid';
import { MazeGenerator } from '@/types/mazeGenerator';
import { neighbors4, random, second_neighbors4, shuffle } from '@features/algo/utils';

// prim's spanning tree (randomized)
export const prims: MazeGenerator = function* (rows, cols) {
    yield { type: 'fill-wall' };

    const id = (s: Coord) => s.r * cols + s.c;
    const inb = (s: Coord) => s.r >= 0 && s.r < rows && s.c >= 0 && s.c < cols;

    const frontiers: Coord[] = [];
    const seen = new Uint8Array(rows * cols);
    const taken = new Uint8Array(rows * cols);

    const start: Coord = {
        r: random(0, rows - 1),
        c: random(0, cols - 1),
    }; // start from {odd, odd } point
    if ((start.r & 1) === 0) start.r--;
    if ((start.c & 1) === 0) start.c--;

    const isCell = (u: Coord) => {
        return (u.r & 1) == 1 && (u.c & 1) == 1;
    };

    const addFrontiers = (u: Coord) => {
        for (const v of second_neighbors4(u)) {
            if (inb(v) && !seen[id(v)] && isCell(v)) {
                const mid: Coord = {
                    r: (u.r + v.r) >> 1,
                    c: (u.c + v.c) >> 1,
                };
                if (!taken[id(mid)]) {
                    taken[id(mid)] = 1;
                    frontiers.push(mid);
                }
            }
        }
    };

    addFrontiers(start);
    seen[id(start)] = 1;
    yield { type: 'carve', at: start };

    while (frontiers.length > 0) {
        shuffle(frontiers);
        const idx = random(0, frontiers.length - 1);
        const u = frontiers[idx];
        frontiers[idx] = frontiers[frontiers.length - 1];
        frontiers.pop();

        for (const v of neighbors4(u)) {
            if (!inb(v) || !seen[id(v)]) continue;
            // v is on carved side
            const dr = u.r - v.r,
                dc = u.c - v.c;
            const opp: Coord = { r: v.r + 2 * dr, c: v.c + 2 * dc };
            if (inb(opp) && !seen[id(opp)] && isCell(opp)) {
                // take v and opp
                yield { type: 'carve', at: u };
                yield { type: 'carve', at: opp };
                seen[id(opp)] = 1;

                addFrontiers(opp);
                break;
            }
        }
    }

    yield { type: 'done' };
};
