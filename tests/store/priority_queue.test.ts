import { describe, expect, it } from 'vitest';
import { min_priority_queue } from '@/store/priority_queue';
import { seedRandom } from '../helpers/random';

describe('min_priority_queue', () => {
    it('returns null when empty', () => {
        const pq = new min_priority_queue();
        expect(pq.pop()).toBeNull();
        expect(pq.empty()).toBe(true);
        expect(pq.size()).toBe(0);
    });

    it('pops the smallest dist first', () => {
        const pq = new min_priority_queue();
        pq.push(5, 50);
        pq.push(1, 10);
        pq.push(3, 30);
        expect(pq.pop()).toEqual({ dist: 1, id: 10 });
        expect(pq.pop()).toEqual({ dist: 3, id: 30 });
        expect(pq.pop()).toEqual({ dist: 5, id: 50 });
        expect(pq.empty()).toBe(true);
    });

    it('keeps duplicate distances (dijkstra pushes stale entries)', () => {
        const pq = new min_priority_queue();
        pq.push(2, 1);
        pq.push(2, 2);
        pq.push(2, 3);
        expect(pq.size()).toBe(3);
        const ids = [pq.pop()!.id, pq.pop()!.id, pq.pop()!.id].sort();
        expect(ids).toEqual([1, 2, 3]);
    });

    it('drains in sorted order for random input', () => {
        seedRandom(7);
        const pq = new min_priority_queue();
        const values = Array.from({ length: 500 }, () => Math.floor(Math.random() * 1000));
        values.forEach((d, i) => pq.push(d, i));

        const drained: number[] = [];
        while (!pq.empty()) drained.push(pq.pop()!.dist);
        expect(drained).toEqual([...values].sort((a, b) => a - b));
    });
});
