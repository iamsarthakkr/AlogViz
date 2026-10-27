import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { CanvasGrid, CanvasGridHandle } from '@/features/CanvasGrid';
import { useGridStore } from '@/features/store';
import { lightPalette } from '@/features/painters';
import { CellKind } from '@/types/grid';
import { MockCtx } from '../../helpers/canvas';
import { installFakeRaf } from '../../helpers/raf';

const CELL = 10;
const api = () => useGridStore.getState();

describe('CanvasGrid', () => {
    let raf: ReturnType<typeof installFakeRaf>;

    beforeEach(() => {
        raf = installFakeRaf();
        // jsdom has no pointer capture; the component logs and carries on
        vi.spyOn(console, 'error').mockImplementation(() => {});
        api().reset(5, 8, CELL);
        api().setStart(2, 1);
        api().setGoal(2, 6);
    });

    const setup = () => {
        const ref = createRef<CanvasGridHandle>();
        const utils = render(<CanvasGrid ref={ref} />);
        const surface = utils.container.firstChild as HTMLElement;
        // jsdom lays nothing out, so the surface sits at (0,0): client coords == grid pixels
        const at = (r: number, c: number) => ({ clientX: c * CELL + 5, clientY: r * CELL + 5, pointerId: 1 });
        return { ref, surface, at, ...utils };
    };

    it('sizes itself to the grid', () => {
        const { surface } = setup();
        expect(surface.style.width).toBe('80px');
        expect(surface.style.height).toBe('50px');
    });

    it('draws the base scene on the next frame', () => {
        const { ref } = setup();
        const base = ref.current!.getBaseCtx() as MockCtx;
        act(() => void raf.flush());
        expect(base.fills[0].style).toBe(lightPalette.background);
    });

    it('paints a wall on click and keeps painting while dragging', () => {
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(0, 0));
        fireEvent.pointerMove(surface, at(0, 1));
        fireEvent.pointerMove(surface, at(0, 2));
        fireEvent.pointerUp(surface, at(0, 2));
        fireEvent.pointerMove(surface, at(0, 3));

        expect([api().at(0, 0), api().at(0, 1), api().at(0, 2)]).toEqual(Array(3).fill(CellKind.wall));
        expect(api().at(0, 3)).toBe(CellKind.empty);
    });

    it('erases with the right mouse button or alt', () => {
        api().setCell(0, 0, CellKind.wall);
        api().setCell(0, 1, CellKind.wall);
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, { ...at(0, 0), button: 2 });
        fireEvent.pointerUp(surface, at(0, 0));
        fireEvent.pointerDown(surface, { ...at(0, 1), altKey: true });
        expect(api().at(0, 0)).toBe(CellKind.empty);
        expect(api().at(0, 1)).toBe(CellKind.empty);
    });

    // touch has no right button or alt, so the cell a drag starts on picks the brush
    describe('a drag that starts on a wall', () => {
        it('erases, for the whole drag', () => {
            [0, 1, 2].forEach((c) => api().setCell(0, c, CellKind.wall));
            const { surface, at } = setup();
            fireEvent.pointerDown(surface, at(0, 0));
            fireEvent.pointerMove(surface, at(0, 1));
            fireEvent.pointerMove(surface, at(0, 2));
            fireEvent.pointerUp(surface, at(0, 2));

            expect([api().at(0, 0), api().at(0, 1), api().at(0, 2)]).toEqual(Array(3).fill(CellKind.empty));
        });

        // the brush is picked once per drag, so crossing empty cells doesn't flip it to drawing
        it('leaves empty cells it crosses empty', () => {
            api().setCell(0, 0, CellKind.wall);
            const { surface, at } = setup();
            fireEvent.pointerDown(surface, at(0, 0));
            fireEvent.pointerMove(surface, at(0, 1));

            expect(api().at(0, 1)).toBe(CellKind.empty);
        });
    });

    it('a drag that starts on an empty cell draws over walls it crosses', () => {
        api().setCell(0, 1, CellKind.wall);
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(0, 0));
        fireEvent.pointerMove(surface, at(0, 1));
        fireEvent.pointerMove(surface, at(0, 2));

        expect([api().at(0, 0), api().at(0, 1), api().at(0, 2)]).toEqual(Array(3).fill(CellKind.wall));
    });

    // cells are a flat array, so (r, cols) would read (r + 1, 0): a wall there must not pick the eraser
    it('a drag starting just past the right edge draws, even if the next row starts with a wall', () => {
        const { cols } = api();
        api().setCell(1, 0, CellKind.wall);
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(0, cols));
        fireEvent.pointerMove(surface, at(0, cols - 1));

        expect(api().at(0, cols - 1)).toBe(CellKind.wall);
    });

    it('drags the start and goal markers instead of painting over them', () => {
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(2, 1));
        fireEvent.pointerMove(surface, at(4, 0));
        fireEvent.pointerUp(surface, at(4, 0));
        expect(api().start).toEqual({ r: 4, c: 0 });

        fireEvent.pointerDown(surface, at(2, 6));
        fireEvent.pointerMove(surface, at(0, 7));
        fireEvent.pointerLeave(surface, at(0, 7));
        expect(api().goal).toEqual({ r: 0, c: 7 });
        expect(api().cells.every((k) => k === CellKind.empty)).toBe(true);
    });

    it('ignores pointer input outside the grid', () => {
        const { surface, at } = setup();
        const before = api().cells;
        fireEvent.pointerDown(surface, at(9, 9));
        expect(api().cells).toBe(before);
    });

    it('ignores all editing while the grid is locked', () => {
        api().setGridLock(true);
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(0, 0));
        fireEvent.pointerMove(surface, at(0, 1));
        expect(api().at(0, 0)).toBe(CellKind.empty);
        expect(api().at(0, 1)).toBe(CellKind.empty);
    });

    it('stops painting once the pointer is cancelled', () => {
        const { surface, at } = setup();
        fireEvent.pointerDown(surface, at(0, 0));
        fireEvent.pointerCancel(surface, at(0, 0));
        fireEvent.pointerMove(surface, at(0, 1));

        expect(api().at(0, 0)).toBe(CellKind.wall);
        expect(api().at(0, 1)).toBe(CellKind.empty);
    });

    it('bumps gridVersion on edits so cached algorithm runs are invalidated', () => {
        const { surface, at } = setup();
        const version = api().gridVersion;
        fireEvent.pointerDown(surface, at(0, 0));
        expect(api().gridVersion).toBeGreaterThan(version);
    });

    it('suppresses the browser context menu', () => {
        const { surface } = setup();
        expect(fireEvent.contextMenu(surface)).toBe(false);
    });

    it('handle: clearOverlay clears the overlay and redrawBase repaints the base', () => {
        const { ref } = setup();
        const overlay = ref.current!.getOverlayCtx() as MockCtx;
        const base = ref.current!.getBaseCtx() as MockCtx;
        ref.current!.clearOverlay();
        expect(overlay.clearRect).toHaveBeenCalledWith(0, 0, 80, 50);
        base.fills.length = 0;
        ref.current!.redrawBase();
        expect(base.fills.length).toBeGreaterThan(0);
    });

    it('claims touch gestures so dragging paints instead of scrolling', () => {
        const { surface } = setup();
        expect(surface).toHaveStyle({ touchAction: 'none' });
    });
});
