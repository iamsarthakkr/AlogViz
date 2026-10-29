import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Legend } from '@/ui/Legend';
import { lightPalette as palette } from '@/features/painters';
import { MockCtx } from '../helpers/canvas';

const LABELS = ['Start', 'Goal', 'Wall', 'Frontier', 'Visited', 'Path'];

// the swatch canvas next to a label, and the recording context it was drawn on
const swatch = (label: string) => screen.getByText(label).closest('li')!.querySelector('canvas')!;
const swatchCtx = (label: string) => swatch(label).getContext('2d') as unknown as MockCtx;
const fillStyles = (label: string) => swatchCtx(label).fills.map((f) => f.style);

describe('Legend', () => {
    it('is a labelled side region the page can place', () => {
        render(<Legend className="[grid-area:legend]" />);
        const region = screen.getByRole('complementary', { name: 'Legend' });
        expect(region).toHaveClass('[grid-area:legend]');
        expect(region).toHaveTextContent('Legend');
    });

    it('lists every item, each with a swatch', () => {
        render(<Legend />);
        expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(LABELS);
        LABELS.forEach((label) => expect(swatch(label)).toBeInTheDocument());
    });

    // the label carries the meaning; the swatch is decoration
    it('hides the swatches from screen readers', () => {
        render(<Legend />);
        LABELS.forEach((label) => expect(swatch(label)).toHaveAttribute('aria-hidden', 'true'));
    });

    it('borders each swatch with the grid line colour', () => {
        render(<Legend />);
        LABELS.forEach((label) => expect(swatch(label)).toHaveStyle({ borderColor: palette.gridLine }));
    });

    // Swatches are drawn with the grid's palette and painters, so they can't drift from what the grid shows
    describe('swatches match the grid', () => {
        // on the grid everything is drawn over an empty cell, and frontier/visited are translucent;
        // without this background the panel colour would show through instead
        it('every swatch starts with a full empty-cell background', () => {
            render(<Legend />);
            LABELS.forEach((label) => {
                const size = parseFloat(swatch(label).style.width);
                expect(swatchCtx(label).fills[0]).toEqual({ style: palette.cellEmpty, x: 0, y: 0, w: size, h: size });
            });
        });

        it.each([
            ['Wall', palette.cellWall],
            ['Frontier', palette.frontier],
            ['Path', palette.pathCell],
        ])('%s then fills the whole swatch with its palette colour', (label, colour) => {
            render(<Legend />);
            const size = parseFloat(swatch(label).style.width);
            expect(swatchCtx(label).fills.slice(1)).toEqual([{ style: colour, x: 0, y: 0, w: size, h: size }]);
        });

        // both colours are translucent and a visited cell was queued first, so on screen it is
        // visited over frontier; a flat visited swatch would look different
        it('Visited paints frontier, then visited on top, like the overlay does', () => {
            render(<Legend />);
            expect(fillStyles('Visited')).toEqual([palette.cellEmpty, palette.frontier, palette.visited]);
        });

        it.each([
            ['Start', palette.start],
            ['Goal', palette.goal],
        ])('%s is drawn with its marker painter', (label, colour) => {
            render(<Legend />);
            expect(swatchCtx(label).strokeStyles).toEqual([colour]);
        });
    });

    // the page re-renders every animation frame during a run; swatches must not redraw each time
    it('does not redraw the swatches when it re-renders', () => {
        const { rerender } = render(<Legend />);
        const ctx = swatchCtx('Wall');
        const fills = ctx.fills.length;
        const clears = vi.mocked(ctx.clearRect).mock.calls.length;

        rerender(<Legend />);
        rerender(<Legend />);
        expect(ctx.fills).toHaveLength(fills);
        expect(ctx.clearRect).toHaveBeenCalledTimes(clears);
    });
});
