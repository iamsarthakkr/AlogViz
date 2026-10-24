import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '@/features/Toolbar/Settings';
import { useGridStore } from '@/features/store';

describe('Settings', () => {
    const open = async () => {
        render(<Settings />);
        await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    };
    const inputs = () => screen.getAllByRole('spinbutton') as HTMLInputElement[];

    it('is closed until the settings button is clicked', async () => {
        render(<Settings />);
        expect(screen.queryByText('Grid Settings')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
        expect(screen.getByText('Grid Settings')).toBeInTheDocument();
    });

    it('pre-fills the drafts from the current grid', async () => {
        const { rows, cols, cellSize } = useGridStore.getState();
        await open();
        expect(inputs().map((i) => Number(i.value))).toEqual([rows, cols, cellSize]);
    });

    it('applies the new dimensions and cell size, then closes', async () => {
        await open();
        const [rows, cols, cell] = inputs();
        fireEvent.change(rows, { target: { value: '10' } });
        fireEvent.change(cols, { target: { value: '12' } });
        fireEvent.change(cell, { target: { value: '16' } });
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

        expect(useGridStore.getState()).toMatchObject({ rows: 10, cols: 12, cellSize: 16 });
        expect(screen.queryByText('Grid Settings')).not.toBeInTheDocument();
    });

    it('cancel closes without changing the grid', async () => {
        const { rows } = useGridStore.getState();
        await open();
        fireEvent.change(inputs()[0], { target: { value: '7' } });
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(useGridStore.getState().rows).toBe(rows);
        expect(screen.queryByText('Grid Settings')).not.toBeInTheDocument();
    });
});
