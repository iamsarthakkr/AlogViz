import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from '@/components/Dropdown';

describe('Dropdown', () => {
    it('shows the title and every option', () => {
        render(<Dropdown title="Pick one" options={['a', 'b', 'c']} onSelect={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Pick one' })).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['a', 'b', 'c']);
    });

    it('calls onSelect with the clicked option', async () => {
        const onSelect = vi.fn();
        render(<Dropdown title="Pick" options={['a', 'b']} onSelect={onSelect} />);
        await userEvent.click(screen.getByText('b'));
        expect(onSelect).toHaveBeenCalledWith('b');
    });

    // daisyUI dropdowns stay open while focused, so selecting must blur to close the menu
    it('blurs the focused element shortly after selecting so the menu closes', () => {
        vi.useFakeTimers();
        try {
            render(<Dropdown title="Pick" options={['a']} onSelect={vi.fn()} />);
            const trigger = screen.getByRole('button', { name: 'Pick' });
            trigger.focus();
            screen.getByText('a').click();
            expect(trigger).toHaveFocus();
            act(() => vi.advanceTimersByTime(10));
            expect(trigger).not.toHaveFocus();
        } finally {
            vi.useRealTimers();
        }
    });

    it('applies an extra className', () => {
        const { container } = render(<Dropdown title="t" options={[]} onSelect={vi.fn()} className="w-40" />);
        expect(container.firstChild).toHaveClass('d-dropdown', 'w-40');
    });
});
