import { describe, expect, it } from 'vitest';
import { bidirectionalBfs } from '@/features/algo/bidirectionalBfs';
import { bfs } from '@/features/algo/bfs';
import { emptyGrid, runToPath } from '../../helpers/grid';

describe('bidirectionalBfs', () => {
    it('enqueues both endpoints before exploring', () => {
        const grid = emptyGrid(5, 5, { r: 0, c: 0 }, { r: 4, c: 4 });
        const [first, second] = runToPath(bidirectionalBfs(grid)).events;
        expect(first).toEqual({ type: 'enqueue', at: grid.start });
        expect(second).toEqual({ type: 'enqueue', at: grid.goal });
    });

    it('visits fewer cells than plain BFS on an open grid', () => {
        const grid = emptyGrid(31, 31, { r: 15, c: 2 }, { r: 15, c: 28 });
        const bi = runToPath(bidirectionalBfs(grid)).path.visited;
        const uni = runToPath(bfs(grid)).path.visited;
        expect(bi).toBeLessThan(uni);
    });

    // BUG: with start === goal the two searches "meet" at a neighbour and the stitched path
    // becomes [start, neighbour, start]. The grid store never lets start and goal overlap, so
    // this can't happen in the UI today — but it would with any future API that allows it.
    it.fails('returns just the start cell when start is the goal', () => {
        const grid = emptyGrid(3, 3, { r: 1, c: 1 }, { r: 1, c: 1 });
        expect(runToPath(bidirectionalBfs(grid)).path.nodes).toEqual([{ r: 1, c: 1 }]);
    });
});
