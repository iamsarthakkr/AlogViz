// Authored by - Sarthak Kumar
//
// constants: grid sizing limits for utils/layout.ts, and the initial grid the store starts with
// before useResponsiveGrid measures the page and picks the real dimensions.

// initial grid (the store's default); replaced on load by pickGridLayout
export const ROWS = 35;
export const COLS = 61;
export const CELL_SIZE = 20;

// size range for cells in px
export const MIN_CELL = 12;
export const MAX_CELL = 32;

export const MIN_ROWS = 11;
export const MAX_ROWS = 41;
export const COL_PRESETS: readonly number[] = [21, 35, 41, 51]; // cols presets, chosen by how wide the grid's box actually is
export const TARGET_CELL = 24; // "comfortable" cell size in px
