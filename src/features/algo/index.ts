import { PathFinder } from '@/types/algo';
import { bfs } from './bfs';
import { dfs } from './dfs';
import { bidirectionalBfs } from './bidirectionalBfs';

export const algorithms: Record<string, PathFinder> = {
    'Breath-first search': bfs,
    'Depth-first search': dfs,
    'Bidirectional BFS': bidirectionalBfs,
};

export const algoLabels = [
    'Breath-first search',
    'Depth-first search', //
    'Bidirectional BFS',
];
