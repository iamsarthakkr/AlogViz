// Authored by - Sarthak Kumar
//
// grid types: core Grid shape + GridState (Grid + useGridStore's actions).
// Coords are flattened to r*cols+c everywhere — there's no 2D array anywhere in the app.

export type Coord = { r: number; c: number };

export enum CellKind {
    empty,
    wall,
}
export enum DragMode {
    None,
    Paint,
    MoveStart,
    MoveGoal,
}
export enum Brush {
    Wall,
    Erase,
}

export type Grid = {
    gridVersion: number;
    rows: number;
    cols: number;
    cellSize: number;
    cells: CellKind[];
    weights: number[]; // cost to enter each cell
    start: Coord;
    goal: Coord;
    gridLock: boolean;
};

export type GridState = Grid & {
    idx(r: number, c: number): number;
    inBounds(r: number, c: number): boolean;
    at(r: number, c: number): CellKind;

    setWall(r: number, c: number): void;
    clearWall(r: number, c: number): void;
    clearWalls(): void;
    fillWalls(): void;

    setWeight(r: number, c: number, w: number): void;
    clearWeight(r: number, c: number): void;
    clearWeights(): void;

    setStart(r: number, c: number): void;
    setGoal(r: number, c: number): void;

    validStart(): boolean;
    validGoal(): boolean;

    setGridLock(flag: boolean): void;

    refresh(): void;
    reset(rows?: number, cols?: number, cellSize?: number): void;
    resize(cellSize: number): void;
};

export type GridSnapShot = Grid;

export type GridLayout = Pick<Grid, 'rows' | 'cols' | 'cellSize'>;
