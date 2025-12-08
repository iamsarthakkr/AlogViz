import { MazeGenerator } from '@/types/mazeGenerator';
import { randomGenerator } from './random';
import { floodFill } from './floodFill';
import { prims } from './prims';

export const mazes: Record<string, MazeGenerator> = {
    'Random Walls': randomGenerator,
    'Recursive Backtrack': floodFill,
    "Prim's": prims,
};
export const mazesLabels: string[] = ['Random Walls', 'Recursive Backtrack', "Prim's"];
