import { describe, expect, it } from 'vitest';
import { fitCellSize, pickGridLayout } from '@/utils/layout';
import { COL_PRESETS, MAX_CELL, MAX_ROWS, MIN_CELL, MIN_ROWS, TARGET_CELL } from '@/utils/constants';

// Inputs are built from the constants, so each expectation reads as the rule it checks
// and the tests keep working when the constants are tuned.
const SMALLEST = COL_PRESETS[0];
const LARGEST = COL_PRESETS[COL_PRESETS.length - 1];
const MID_CELL = Math.floor((MIN_CELL + MAX_CELL) / 2); // any size comfortably inside the clamp
const ROOMY = 100_000; // a side so long it is never the limiting one

describe('fitCellSize', () => {
    const rows = MIN_ROWS;
    const cols = SMALLEST;

    it('is limited by the width when the width is the tighter side', () => {
        expect(fitCellSize(cols * MID_CELL, ROOMY, rows, cols)).toBe(MID_CELL);
    });

    it('is limited by the height when the height is the tighter side', () => {
        expect(fitCellSize(ROOMY, rows * MID_CELL, rows, cols)).toBe(MID_CELL);
    });

    it('rounds down to a whole pixel', () => {
        const oneShortOfNextSize = cols * (MID_CELL + 1) - 1;
        expect(fitCellSize(oneShortOfNextSize, ROOMY, rows, cols)).toBe(MID_CELL);
    });

    it('clamps to MIN_CELL on a box too small for it, accepting overflow', () => {
        expect(fitCellSize(cols * (MIN_CELL - 1), ROOMY, rows, cols)).toBe(MIN_CELL);
        expect(fitCellSize(0, 0, rows, cols)).toBe(MIN_CELL);
    });

    it('clamps to MAX_CELL on a box with room for bigger cells', () => {
        expect(fitCellSize(cols * (MAX_CELL + 1), ROOMY, rows, cols)).toBe(MAX_CELL);
    });

    it('gives the largest cells that still fit when the box is rotated', () => {
        const portrait = { w: SMALLEST * MID_CELL, h: (SMALLEST + 2) * MID_CELL };
        const landscape = { w: portrait.h, h: portrait.w };
        const grid = pickGridLayout(portrait.w, portrait.h);

        const cell = fitCellSize(landscape.w, landscape.h, grid.rows, grid.cols);
        const fits = (size: number) => grid.cols * size <= landscape.w && grid.rows * size <= landscape.h;
        expect(fits(cell)).toBe(true);
        expect(fits(cell + 1)).toBe(false);
    });
});

describe('pickGridLayout', () => {
    it('falls back to the smallest preset when no preset reaches TARGET_CELL', () => {
        expect(pickGridLayout(SMALLEST * TARGET_CELL - 1, ROOMY).cols).toBe(SMALLEST);
    });

    it('picks the largest preset once the box is wide enough for it', () => {
        expect(pickGridLayout(LARGEST * TARGET_CELL, ROOMY).cols).toBe(LARGEST);
    });

    it('switches preset exactly where cells reach TARGET_CELL', () => {
        for (const preset of COL_PRESETS.slice(1)) {
            expect(pickGridLayout(preset * TARGET_CELL, ROOMY).cols).toBe(preset);
            expect(pickGridLayout(preset * TARGET_CELL - 1, ROOMY).cols).toBeLessThan(preset);
        }
    });

    it('rounds an even row count down to odd', () => {
        const evenRows = MIN_ROWS + 3; // MIN_ROWS is odd, so this is even and above the floor
        const { rows, cols } = pickGridLayout(SMALLEST * MID_CELL, evenRows * MID_CELL);

        expect(cols).toBe(SMALLEST); // guard: the box must give MID_CELL cells for the row count to hold
        expect(rows).toBe(evenRows - 1);
    });

    it('keeps MIN_ROWS on a box too short for them by shrinking the cells', () => {
        const width = SMALLEST * MAX_CELL;
        const height = (MIN_ROWS - 2) * MAX_CELL; // only fits MIN_ROWS - 2 rows at the width's cell size

        const { rows, cellSize } = pickGridLayout(width, height);
        expect(rows).toBe(MIN_ROWS);
        expect(cellSize).toBe(Math.floor(height / MIN_ROWS));
    });

    it('caps rows at MAX_ROWS on a very tall box', () => {
        expect(pickGridLayout(SMALLEST * MID_CELL, ROOMY).rows).toBe(MAX_ROWS);
    });

    it('handles an unmeasured 0x0 box (jsdom, before layout) without NaN or Infinity', () => {
        expect(pickGridLayout(0, 0)).toEqual({ rows: MIN_ROWS, cols: SMALLEST, cellSize: MIN_CELL });
    });

    // regression: reversing COL_PRESETS in place flipped the search order on every other call
    it('returns the same layout on repeated calls and leaves COL_PRESETS untouched', () => {
        const presets = [...COL_PRESETS];
        const width = LARGEST * TARGET_CELL;

        const first = pickGridLayout(width, ROOMY);
        expect(pickGridLayout(width, ROOMY)).toEqual(first);
        expect(pickGridLayout(width, ROOMY)).toEqual(first);
        expect(COL_PRESETS).toEqual(presets);
    });

    it('never picks fewer columns for a wider box', () => {
        let prev = 0;
        for (let width = 0; width <= LARGEST * MAX_CELL; width += 10) {
            const { cols } = pickGridLayout(width, ROOMY);
            expect(cols).toBeGreaterThanOrEqual(prev);
            prev = cols;
        }
    });

    // Realistic boxes: the device viewport minus the page chrome around the grid (approximate)
    describe.each([
        { device: 'small phone, portrait', width: 320, height: 500 },
        { device: 'phone, portrait', width: 358, height: 620 },
        { device: 'phone, landscape with browser bars', width: 708, height: 250 },
        { device: 'tablet, portrait', width: 736, height: 880 },
        { device: 'small laptop', width: 760, height: 560 },
        { device: 'laptop', width: 960, height: 700 },
        { device: 'desktop', width: 1400, height: 900 },
        { device: 'large monitor', width: 2000, height: 1250 },
        {
            device: 'smaller than the minimum grid',
            width: SMALLEST * MIN_CELL - 1,
            height: MIN_ROWS * MIN_CELL - 1,
        },
    ])('$device ($width x $height)', ({ width, height }) => {
        const { rows, cols, cellSize } = pickGridLayout(width, height);

        it('has odd rows and cols within bounds', () => {
            expect(rows % 2).toBe(1);
            expect(cols % 2).toBe(1);
            expect(COL_PRESETS).toContain(cols);
            expect(rows).toBeGreaterThanOrEqual(MIN_ROWS);
            expect(rows).toBeLessThanOrEqual(MAX_ROWS);
        });

        it('has a whole-pixel cell size within the clamp', () => {
            expect(Number.isInteger(cellSize)).toBe(true);
            expect(cellSize).toBeGreaterThanOrEqual(MIN_CELL);
            expect(cellSize).toBeLessThanOrEqual(MAX_CELL);
        });

        it('fits inside the box unless held at MIN_CELL', () => {
            if (cellSize === MIN_CELL) return;
            expect(cols * cellSize).toBeLessThanOrEqual(width);
            expect(rows * cellSize).toBeLessThanOrEqual(height);
        });

        // the first ResizeObserver callback sees the same box, so it must not change the cell size
        it('agrees with fitCellSize for the same box', () => {
            expect(fitCellSize(width, height, rows, cols)).toBe(cellSize);
        });
    });
});
