import { MazeGenerator } from '@/types/mazeGenerator';
import { randomGenerator } from './random';
import { floodFill } from './floodFill';
import { prims } from './prims';
import { recursiveDivision } from './recursiveDivision';

export const mazes: Record<string, MazeGenerator> = {
    'Random Walls': randomGenerator,
    'Randomized Depth First Search': floodFill,
    "Prim's": prims,
    'Recursive Division': recursiveDivision(),
    'Recursive Division (vertical skew)': recursiveDivision(0.7),
    'Recursive Division (horizontal skew)': recursiveDivision(0.3),
};
export const mazesLabels: string[] = [
    'Recursive Division',
    'Recursive Division (vertical skew)',
    'Recursive Division (horizontal skew)',
    "Prim's",
    'Randomized Depth First Search',
    'Random Walls',
];
