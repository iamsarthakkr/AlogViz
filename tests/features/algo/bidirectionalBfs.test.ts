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
});
