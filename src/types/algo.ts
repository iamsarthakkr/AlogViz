import { Coord, GridSnapShot } from './grid';

export type EnqueueEvent = { type: 'enqueue'; at: Coord };
export type VisitEvent = { type: 'visit'; at: Coord };
export type PathEvent = { type: 'path'; nodes: Coord[]; visited: number };

export type AlgoEvent = EnqueueEvent | VisitEvent | PathEvent;

export type AlgoGenerator = Generator<AlgoEvent, void, void>;
export type PathFinder = (grid: GridSnapShot) => AlgoGenerator;
