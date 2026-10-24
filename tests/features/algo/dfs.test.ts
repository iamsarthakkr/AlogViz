import { describe, expect, it } from 'vitest';
import { dfs } from '@/features/algo/dfs';
import { emptyGrid, expectValidPath, parseGrid, referenceDistance, runToPath } from '../../helpers/grid';

describe('dfs', () => {
    it('can return a path longer than the shortest one (no optimality guarantee)', () => {
        const grid = emptyGrid(5, 5, { r: 2, c: 0 }, { r: 2, c: 4 });
        const { path } = runToPath(dfs(grid));
        expectValidPath(grid, path.nodes);
        expect(path.nodes.length - 1).toBeGreaterThan(referenceDistance(grid));
    });

    it('goes deep first: explores straight up from start before trying other directions', () => {
        const grid = parseGrid([
            '.....', //
            '.....',
            'S...G',
        ]);
        const visits = runToPath(dfs(grid)).events.filter((e) => e.type === 'visit');
        expect(visits.slice(0, 3).map((e) => e.type === 'visit' && e.at)).toEqual([
            { r: 2, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: 0 },
        ]);
    });
});
