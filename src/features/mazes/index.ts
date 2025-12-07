import { MazeGenerator } from '@/types/mazeGenerator';
import { randomGenerator } from './random';

export const mazes: Record<string, MazeGenerator> = {
    'Random Walls': randomGenerator,
};
export const mazesLabels: string[] = ['Random Walls'];
