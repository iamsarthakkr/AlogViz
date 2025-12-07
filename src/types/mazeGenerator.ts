import { Coord } from './grid';

export type CarveEvent = { type: 'carve'; at: Coord };
export type WallEvent = { type: 'wall'; at: Coord };
export type FillWallsEvent = { type: 'fill-wall' };
export type ClearWallsEvent = { type: 'clear-wall' };
export type FinalEvent = { type: 'done' };

export type MazeGeneratorEvent = FillWallsEvent | ClearWallsEvent | CarveEvent | WallEvent | FinalEvent;

export type MazeGenerator = (rows: number, cols: number) => Generator<MazeGeneratorEvent, void, void>;
