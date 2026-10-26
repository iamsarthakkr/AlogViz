// Authored by - Sarthak Kumar
//
// useResponsiveGrid: sizes the grid to the box it is rendered in.
// - On mount: measures the box, picks rows/cols/cellSize (pickGridLayout) and resets the grid
// - On box resize: keeps rows/cols (and the user's walls), only rescales the cells (fitCellSize)
// - useLayoutEffect, not useEffect: the layout is applied before the first paint, so the default
//   grid never flashes on screen
// - The box must have no padding/border: load measures the border box, ResizeObserver reports the
//   content box, and the two must agree or the first callback rescales the grid
// - The box must get its size from the page (flex-1 min-h-0), not from the grid inside it,
//   otherwise growing the grid grows the box and the measurement never shrinks

import React from 'react';
import { fitCellSize, pickGridLayout } from '@/utils/layout';
import { useGridStore } from '@/features/store';

export const useResponsiveGrid = (boxRef: React.RefObject<HTMLElement | null>) => {
    React.useLayoutEffect(() => {
        const box = boxRef.current;
        if (!box) {
            return;
        }
        const { width, height } = box.getBoundingClientRect();
        const gridLayout = pickGridLayout(width, height);
        useGridStore.getState().reset(gridLayout.rows, gridLayout.cols, gridLayout.cellSize);

        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;

            // read fresh: this callback is created once and outlives every render
            const { rows, cols, resize } = useGridStore.getState();

            resize(fitCellSize(width, height, rows, cols));
        });

        observer.observe(box);

        return () => observer.disconnect();
    }, [boxRef]);
};
