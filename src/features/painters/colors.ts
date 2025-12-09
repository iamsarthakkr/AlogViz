export type GridPalette = {
    // base scene
    cellEmpty: string;
    cellWall: string;
    gridLine: string;
    background: string;

    // markers
    start: string;
    goal: string;

    // overlay (algorithms)
    frontier: string;
    visited: string;
    pathCell: string;
};

export const lightPalette: GridPalette = {
    cellEmpty: '#ffffff',
    cellWall: '#05181c',
    gridLine: '#8fade8',
    background: '#ffffff',

    start: '#87260e',
    goal: '#ef4444',

    frontier: 'rgba(139, 209, 221, 0.5)',
    visited: 'rgba(81, 213, 239, 0.7)',
    pathCell: '#efea51',
};

export const darkPalette: GridPalette = {
    cellEmpty: '#ffffff',
    cellWall: '#05181c',
    gridLine: '#8fade8',
    background: '#ffffff',

    start: '#87260e',
    goal: '#ef4444',

    frontier: 'rgba(139, 209, 221, 0.5)',
    visited: 'rgba(81, 213, 239, 0.7)',
    pathCell: '#efea51',
};
