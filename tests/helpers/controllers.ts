import { vi } from 'vitest';
import type { AlgoController, MazeGeneratorApi } from '@/features/animations';
import { algoLabels } from '@/features/algo';
import { speedToEPS } from '@/utils/settings';

// Stand-ins for the controller and maze generator that ui/Grid.tsx owns, so the toolbar
// components can be tested in any state without running an algorithm.
export function fakeAlgoController(overrides: Partial<AlgoController> = {}): AlgoController {
    return {
        currentAlgo: algoLabels[0],
        setAlgorithm: vi.fn(),
        status: 'idle',
        speed: speedToEPS.medium,
        pathLen: null,
        visitedApprox: 0,
        clear: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        step: vi.fn(),
        skipToEnd: vi.fn(),
        setSpeed: vi.fn(),
        recreate: vi.fn(),
        ...overrides,
    };
}

export function fakeMazeGenerator(): MazeGeneratorApi {
    return { generate: vi.fn() };
}
