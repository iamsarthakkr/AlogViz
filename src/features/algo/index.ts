// Authored by - Sarthak Kumar
//
// algo/index: registry of pathfinding algorithms.
// - `algorithms`: label -> PathFinder generator function
// - `algoLabels`: display order for the algorithm dropdown (must stay in sync with `algorithms`)

import { PathFinder } from '@/types/algo';
import { bfs } from './bfs';
import { dfs } from './dfs';
import { bidirectionalBfs } from './bidirectionalBfs';
import { dijkstra } from './dijkstra';

export const algorithms: Record<string, PathFinder> = {
    'Breath-first search': bfs,
    'Depth-first search': dfs,
    'Bidirectional BFS': bidirectionalBfs,
    "Dijkstra's": dijkstra,
};

export const algoLabels = [
    'Breath-first search',
    'Depth-first search',
    'Bidirectional BFS',
    "Dijkstra's", //
];
