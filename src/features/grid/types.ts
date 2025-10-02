export type Coord = { r: number; c: number };
export enum CellKind {
    empty = 'empty',
    wall = 'wall',
}

export type Grid = {
    gridVersion: number;
    rows: number;
    cols: number;
    cellSize: number;
    cells: CellKind[];
    start: Coord;
    goal: Coord;
};

export type GridState = Grid & {
    idx(r: number, c: number): number;
    inBounds(r: number, c: number): boolean;

    at(r: number, c: number): CellKind;

    setDimensions(rows: number, cols: number): void;
    setCellSize(px: number): void;

    setCell(r: number, c: number, kind: CellKind): void;
    toggleWall(r: number, c: number): void;
    clearWalls(): void;
    randomWalls(p: number): void;

    setStart(r: number, c: number): void;
    setGoal(r: number, c: number): void;

    reset(): void;
};

export type SpeedPreset = 'slow' | 'medium' | 'fast';
export type SettingsState = {
    algoKey: string;
    speed: SpeedPreset;
    isSettingsOpen: boolean;

    // settings modal drafts
    rowsDraft: number;
    colsDraft: number;
    cellSizeDraft: number;

    // placeholder for maze generator
    mazeGeneratorKey: string;

    // actions
    setAlgoKey: (k: string) => void;
    setSpeed: (s: SpeedPreset) => void;

    openSettings: (rows: number, cols: number, cellSize: number) => void;
    closeSettings: () => void;
    setDraftRows: (v: number) => void;
    setDraftCols: (v: number) => void;
    setDraftCell: (v: number) => void;

    setMazeGeneratorKey: (k: string) => void;
};
