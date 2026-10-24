import { describe, expect, it } from 'vitest';
import { prims } from '@/features/mazes/prims';
import { CellKind } from '@/types/grid';
import { applyMazeEvents, collect, countOpen, countReachable } from '../../helpers/grid';
import { fixRandom, seedRandom } from '../../helpers/random';

const ROWS = 21;
const COLS = 31;

describe('prims', () => {
    it('starts from a solid wall grid', () => {
        seedRandom(1);
        expect(collect(prims(ROWS, COLS))[0]).toEqual({ type: 'fill-wall' });
    });

    it('carves a fully connected perfect maze over the lattice', () => {
        // seeds chosen so the start isn't on row/col 0 — see the it.fails below
        for (const seed of [2, 3, 4, 5, 8]) {
            seedRandom(seed);
            const cells = applyMazeEvents(ROWS, COLS, collect(prims(ROWS, COLS)));
            const lattice = ((ROWS - 1) / 2) * ((COLS - 1) / 2);
            for (let r = 1; r < ROWS; r += 2)
                for (let c = 1; c < COLS; c += 2) expect(cells[r * COLS + c]).toBe(CellKind.empty);
            expect(countOpen(cells)).toBe(2 * lattice - 1);
            expect(countReachable(ROWS, COLS, cells, { r: 1, c: 1 })).toBe(countOpen(cells));
        }
    });

    // BUG: the start is random(0, rows-1) and then decremented when even, so a roll of 0 gives
    // r = -1 (likewise for c). From there no frontier is in bounds and the "maze" is the solid
    // wall grid from fill-wall: about 1 in 20 runs on the default 35x61 grid.
    // Fix: pick with randomOdd(1, rows - 2) / randomOdd(1, cols - 2). See ROADMAP.md.
    it.fails('always carves a maze, even when the RNG rolls 0', () => {
        fixRandom(0);
        const cells = applyMazeEvents(ROWS, COLS, collect(prims(ROWS, COLS)));
        expect(countOpen(cells)).toBeGreaterThan(0);
    });
});
