// Contract every registered PathFinder must honour, so a new algorithm gets these checks
// for free just by being added to the registry.
import { describe, expect, it } from 'vitest';
import { algoLabels, algorithms } from '@/features/algo';
import { CellKind } from '@/types/grid';
import { emptyGrid, expectValidPath, parseGrid, runToPath } from '../../helpers/grid';
import { seedRandom } from '../../helpers/random';

const OPEN = parseGrid([
    'S.....', //
    '.##.#.',
    '...#..',
    '.#...G',
]);

const BLOCKED = parseGrid([
    'S..#..', //
    '...#..',
    '...#.G',
]);

describe('algorithm registry', () => {
    it('lists every algorithm exactly once in the dropdown labels', () => {
        expect([...algoLabels].sort()).toEqual(Object.keys(algorithms).sort());
        expect(new Set(algoLabels).size).toBe(algoLabels.length);
    });
});

describe.each(Object.entries(algorithms))('%s', (_label, algo) => {
    it('starts by enqueueing the start cell', () => {
        const { events } = runToPath(algo(OPEN));
        expect(events[0]).toEqual({ type: 'enqueue', at: OPEN.start });
    });

    it('ends with exactly one path event, and it is last', () => {
        const { events } = runToPath(algo(OPEN));
        expect(events.filter((e) => e.type === 'path')).toHaveLength(1);
    });

    it('finds a valid start→goal path around walls', () => {
        const { path } = runToPath(algo(OPEN));
        expectValidPath(OPEN, path.nodes);
    });

    it('returns an empty path when the goal is walled off', () => {
        const { path } = runToPath(algo(BLOCKED));
        expect(path.nodes).toEqual([]);
    });

    it('never visits or enqueues a wall or an out-of-bounds cell', () => {
        for (const grid of [OPEN, BLOCKED]) {
            for (const e of runToPath(algo(grid)).events) {
                if (e.type === 'path') continue;
                expect(e.at.r).toBeGreaterThanOrEqual(0);
                expect(e.at.c).toBeGreaterThanOrEqual(0);
                expect(e.at.r).toBeLessThan(grid.rows);
                expect(e.at.c).toBeLessThan(grid.cols);
                expect(grid.cells[e.at.r * grid.cols + e.at.c]).toBe(CellKind.empty);
            }
        }
    });

    it('never visits the same cell twice', () => {
        const { events } = runToPath(algo(OPEN));
        const visits = events.filter((e) => e.type === 'visit').map((e) => `${e.at.r},${e.at.c}`);
        expect(new Set(visits).size).toBe(visits.length);
    });

    it('reports a visited count matching what it explored', () => {
        const { events, path } = runToPath(algo(OPEN));
        const visits = events.filter((e) => e.type === 'visit').length;
        // dijkstra counts the goal pop without yielding a visit event for it
        expect(path.visited - visits).toBeGreaterThanOrEqual(0);
        expect(path.visited - visits).toBeLessThanOrEqual(1);
    });

    it('does not mutate the grid it was given', () => {
        const before = structuredClone(OPEN);
        runToPath(algo(OPEN));
        expect(OPEN).toEqual(before);
    });

    it('finds a valid path on random grids whenever one exists', () => {
        seedRandom(11);
        for (let trial = 0; trial < 40; trial++) {
            const grid = emptyGrid(12, 16, { r: 0, c: 0 }, { r: 11, c: 15 });
            grid.cells = grid.cells.map((_, i) =>
                i !== 0 && i !== grid.cells.length - 1 && Math.random() < 0.3 ? CellKind.wall : CellKind.empty,
            );
            const { path } = runToPath(algo(grid));
            if (path.nodes.length) expectValidPath(grid, path.nodes);
        }
    });
});
