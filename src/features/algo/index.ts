import { PathFinder } from '@/types/algo';
import { bfs } from './bfs';
import { dfs } from './dfs';

export const algorithms: Record<string, PathFinder> = {
    bfs,
    dfs,
};
