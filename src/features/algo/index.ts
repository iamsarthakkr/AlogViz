import { PathFinder } from '@/types/algo';
import { bfs } from './bfs';

export const algorithms: Record<string, PathFinder> = {
    bfs,
};
