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

    start: '#10b981',
    goal: '#ef4444',

    frontier: 'rgba(139, 209, 221, 0.5)', // blue-ish
    visited: 'rgba(81, 213, 239, 0.7)', // amber-ish
    pathCell: '#efea51', // green
};

// optional dark theme you can swap in later
export const darkPalette: GridPalette = {
    cellEmpty: '#0b0e14',
    cellWall: '#2b2f37',
    gridLine: '#8fade8',
    background: '#0b0e14',

    start: '#10b981',
    goal: '#ef4444',

    frontier: 'rgba(59,130,246,0.45)',
    visited: 'rgba(250,204,21,0.45)',
    pathCell: '#22c55e',
};
