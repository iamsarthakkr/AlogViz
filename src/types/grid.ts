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
    start: Coord;
    goal: Coord;
    gridLock: boolean;
};

export type GridState = Grid & {
    idx(r: number, c: number): number;
    inBounds(r: number, c: number): boolean;
    at(r: number, c: number): CellKind;

    setDimensions(rows: number, cols: number): void;
    setCellSize(px: number): void;

    setCell(r: number, c: number, kind: CellKind): void;
    clearWalls(): void;
    fillWalls(): void;

    setStart(r: number, c: number): void;
    setGoal(r: number, c: number): void;

    validStart(): boolean;
    validGoal(): boolean;

    setGridLock(flag: boolean): void;

    refresh(): void;
    reset(): void;
};

export type GridSnapShot = Grid;
