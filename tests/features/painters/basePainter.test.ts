import { describe, expect, it } from 'vitest';
import { drawBaseScene, drawGoalMarker, drawMarkers, drawStartMarker, lightPalette } from '@/features/painters';
import { CellKind } from '@/types/grid';
import { createMockCtx } from '../../helpers/canvas';

const S = 10;

describe('basePainter', () => {
    it('drawBaseScene paints background, then one fill per cell in its colour', () => {
        const ctx = createMockCtx();
        const cells = [CellKind.empty, CellKind.wall, CellKind.wall, CellKind.empty];
        drawBaseScene(ctx, 2, 2, S, cells, { r: 0, c: 0 }, { r: 1, c: 1 }, true, true);

        expect(ctx.fills[0]).toMatchObject({ style: lightPalette.background, x: 0, y: 0, w: 20, h: 20 });
        const cellFills = ctx.fills.slice(1, 5).map((f) => f.style);
        expect(cellFills).toEqual([
            lightPalette.cellEmpty,
            lightPalette.cellWall,
            lightPalette.cellWall,
            lightPalette.cellEmpty,
        ]);
        expect(ctx.strokeRect).toHaveBeenCalledWith(0, 0, 20, 20);
    });

    // Lines between two walls are skipped so adjacent walls read as one solid block
    it('skips grid lines between two walls', () => {
        const open = createMockCtx();
        drawBaseScene(
            open,
            1,
            2,
            S,
            [CellKind.empty, CellKind.empty],
            { r: -1, c: -1 },
            { r: -1, c: -1 },
            false,
            false,
        );
        const walled = createMockCtx();
        drawBaseScene(
            walled,
            1,
            2,
            S,
            [CellKind.wall, CellKind.wall],
            { r: -1, c: -1 },
            { r: -1, c: -1 },
            false,
            false,
        );
        expect(open.moveTo).toHaveBeenCalledWith(10, 0);
        expect(walled.moveTo).not.toHaveBeenCalledWith(10, 0);
    });

    it('drawMarkers only draws markers that are valid', () => {
        const ctx = createMockCtx();
        drawMarkers(ctx, { r: 0, c: 0 }, { r: 1, c: 1 }, false, true, S);
        expect(ctx.strokeStyles).toEqual([lightPalette.goal]);

        const none = createMockCtx();
        drawMarkers(none, { r: 0, c: 0 }, { r: 1, c: 1 }, false, false, S);
        expect(none.stroke).not.toHaveBeenCalled();
    });

    it('drawStartMarker strokes an arrow centred in the cell', () => {
        const ctx = createMockCtx();
        drawStartMarker(ctx, { r: 2, c: 3 }, S);
        expect(ctx.strokeStyles).toEqual([lightPalette.start]);
        // centre of (2,3) is (35, 25); the arrow tip sits on the centre line
        expect(ctx.lineTo).toHaveBeenCalledWith(expect.any(Number), 25);
    });

    it('drawGoalMarker draws a filled dot inside a ring', () => {
        const ctx = createMockCtx();
        drawGoalMarker(ctx, { r: 0, c: 0 }, S);
        expect(ctx.arc).toHaveBeenCalledTimes(2);
        expect(ctx.fill).toHaveBeenCalledTimes(1);
        expect(ctx.strokeStyles).toEqual([lightPalette.goal]);
    });
});
