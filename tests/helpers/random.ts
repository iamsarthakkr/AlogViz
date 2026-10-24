import { vi } from 'vitest';

// mulberry32: tiny deterministic PRNG so randomized generators are reproducible per seed
function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function seedRandom(seed: number) {
    return vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
}

export function fixRandom(value: number) {
    return vi.spyOn(Math, 'random').mockReturnValue(value);
}
