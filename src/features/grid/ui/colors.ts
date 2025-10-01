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
    pathStroke: string;
};

export const lightPalette: GridPalette = {
    cellEmpty: '#ffffff',
    cellWall: '#3c3f46',
    gridLine: '#e5e7eb',
    background: '#ffffff',

    start: '#10b981',
    goal: '#ef4444',

    frontier: 'rgba(59,130,246,0.35)', // blue-ish
    visited: 'rgba(234,179,8,0.35)', // amber-ish
    pathStroke: '#22c55e', // green
};

// optional dark theme you can swap in later
export const darkPalette: GridPalette = {
    cellEmpty: '#0b0e14',
    cellWall: '#2b2f37',
    gridLine: '#1f2430',
    background: '#0b0e14',

    start: '#10b981',
    goal: '#ef4444',

    frontier: 'rgba(59,130,246,0.45)',
    visited: 'rgba(250,204,21,0.45)',
    pathStroke: '#22c55e',
};
