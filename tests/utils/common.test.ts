import { describe, expect, it } from 'vitest';
import { clamp } from '@/utils/common';

describe('clamp', () => {
    it.each([
        [5, 0, 10, 5],
        [-3, 0, 10, 0],
        [42, 0, 10, 10],
        [0, 0, 10, 0],
        [10, 0, 10, 10],
    ])('clamp(%i, %i, %i) = %i', (v, lo, hi, expected) => {
        expect(clamp(v, lo, hi)).toBe(expected);
    });
});
