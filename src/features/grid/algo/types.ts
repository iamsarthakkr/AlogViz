import { Coord, Grid } from '../types';

export type GridSnapShot = Grid;

export type EnqueueEvent = { type: 'enqueue'; at: Coord };
export type VisitEvent = { type: 'visit'; at: Coord };
export type PathEvent = { type: 'path'; nodes: Coord[] };

export type AlgoEvent = EnqueueEvent | VisitEvent | PathEvent;

export type PathFinder = (grid: GridSnapShot) => Generator<AlgoEvent, { path: Coord[]; visited: number }, void>;
