// Contract every registered MazeGenerator must honour.
import { describe, expect, it } from 'vitest';
import { mazes, mazesLabels } from '@/features/mazes';
import { collect } from '../../helpers/grid';
import { seedRandom } from '../../helpers/random';

describe('maze registry', () => {
    it('lists every generator exactly once in the dropdown labels', () => {
        expect([...mazesLabels].sort()).toEqual(Object.keys(mazes).sort());
        expect(new Set(mazesLabels).size).toBe(mazesLabels.length);
    });
});

describe.each(Object.entries(mazes))('%s', (_label, generate) => {
    it('starts with a reset event and ends with exactly one done event', () => {
        seedRandom(1);
        const events = collect(generate(21, 31));
        expect(['fill-wall', 'clear-wall']).toContain(events[0].type);
        expect(events.at(-1)).toEqual({ type: 'done' });
        expect(events.filter((e) => e.type === 'done')).toHaveLength(1);
    });

    it('only yields in-bounds coordinates across 50 seeds', () => {
        for (let seed = 1; seed <= 50; seed++) {
            seedRandom(seed);
            for (const e of collect(generate(21, 31))) {
                if (e.type !== 'carve' && e.type !== 'wall') continue;
                expect(e.at.r).toBeGreaterThanOrEqual(0);
                expect(e.at.c).toBeGreaterThanOrEqual(0);
                expect(e.at.r).toBeLessThan(21);
                expect(e.at.c).toBeLessThan(31);
            }
        }
    });
});
