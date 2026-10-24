import { describe, expect, it } from 'vitest';
import { dijkstra } from '@/features/algo/dijkstra';
import { bfs } from '@/features/algo/bfs';
import { emptyGrid, runToPath } from '../../helpers/grid';

describe('dijkstra', () => {
    it('does not emit a visit event for the goal itself', () => {
        const grid = emptyGrid(4, 4, { r: 0, c: 0 }, { r: 3, c: 3 });
        const visits = runToPath(dijkstra(grid)).events.filter((e) => e.type === 'visit');
        expect(visits.some((e) => e.type === 'visit' && e.at.r === 3 && e.at.c === 3)).toBe(false);
    });

    // Documents the ROADMAP High #5 limitation: with every edge weighing 1, dijkstra can't
    // produce a different-length path than BFS on any grid the UI can build.
    it('produces the same path length as BFS while all edges weigh 1', () => {
        const grid = emptyGrid(10, 10, { r: 0, c: 0 }, { r: 9, c: 6 });
        expect(runToPath(dijkstra(grid)).path.nodes.length).toBe(runToPath(bfs(grid)).path.nodes.length);
    });
});
