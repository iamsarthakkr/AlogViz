import { describe, expect, it } from 'vitest';
import { bfs } from '@/features/algo/bfs';
import { emptyGrid, runToPath } from '../../helpers/grid';

describe('bfs', () => {
    it('explores in rings: every visit is at least as far from start as the previous one', () => {
        const grid = emptyGrid(9, 9, { r: 4, c: 4 }, { r: 0, c: 0 });
        const dist = (p: { r: number; c: number }) => Math.abs(p.r - 4) + Math.abs(p.c - 4);
        const visits = runToPath(bfs(grid)).events.flatMap((e) => (e.type === 'visit' ? [dist(e.at)] : []));
        for (let i = 1; i < visits.length; i++) expect(visits[i]).toBeGreaterThanOrEqual(visits[i - 1]);
    });

    it('stops as soon as the goal is enqueued instead of exploring the whole grid', () => {
        const grid = emptyGrid(20, 20, { r: 0, c: 0 }, { r: 0, c: 1 });
        const { path } = runToPath(bfs(grid));
        expect(path.visited).toBe(1);
    });
});
