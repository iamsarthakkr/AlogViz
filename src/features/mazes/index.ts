import { MazeGenerator } from '@/types/mazeGenerator';
import { randomGenerator } from './random';
import { floodFill } from './floodFill';

export const mazes: Record<string, MazeGenerator> = {
    'Random Walls': randomGenerator,
    'Recursive Backtrack': floodFill,
};
export const mazesLabels: string[] = ['Random Walls', 'Recursive Backtrack'];
