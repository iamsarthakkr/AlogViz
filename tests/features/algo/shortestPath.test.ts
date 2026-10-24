// BFS, bidirectional BFS and Dijkstra promise *shortest* paths on this unweighted grid;
// DFS doesn't, so it's only held to the general contract in index.test.ts.
import { describe, expect, it } from 'vitest';
import { bfs } from '@/features/algo/bfs';
import { bidirectionalBfs } from '@/features/algo/bidirectionalBfs';
import { dijkstra } from '@/features/algo/dijkstra';
import { CellKind } from '@/types/grid';
import { emptyGrid, parseGrid, referenceDistance, runToPath } from '../../helpers/grid';
import { seedRandom } from '../../helpers/random';

const shortest = { bfs, bidirectionalBfs, dijkstra };

describe.each(Object.entries(shortest))('%s', (_name, algo) => {
    it('finds the shortest path through a winding corridor', () => {
        const grid = parseGrid([
            'S.#.....', //
            '..#.###.',
            '..#.#...',
            '....#.#G',
        ]);
        const { path } = runToPath(algo(grid));
        expect(path.nodes.length - 1).toBe(referenceDistance(grid));
    });

    it('prefers the short route when a long detour also exists', () => {
        const grid = parseGrid([
            '.........', //
            '.#######.',
            'S.......G',
        ]);
        const { path } = runToPath(algo(grid));
        expect(path.nodes).toHaveLength(9);
    });

    it('handles start and goal next to each other', () => {
        const grid = emptyGrid(3, 3, { r: 1, c: 1 }, { r: 1, c: 2 });
        const { path } = runToPath(algo(grid));
        expect(path.nodes).toEqual([
            { r: 1, c: 1 },
            { r: 1, c: 2 },
        ]);
    });

    it('matches the reference distance on random grids', () => {
        seedRandom(5);
        for (let trial = 0; trial < 60; trial++) {
            const grid = emptyGrid(15, 20, { r: 7, c: 0 }, { r: 3, c: 19 });
            grid.cells = grid.cells.map((_, i) =>
                i === 7 * 20 || i === 3 * 20 + 19 || Math.random() >= 0.3 ? CellKind.empty : CellKind.wall,
            );
            const expected = referenceDistance(grid);
            const { path } = runToPath(algo(grid));
            expect(path.nodes.length - 1).toBe(expected === -1 ? -1 : expected);
        }
    });
});
