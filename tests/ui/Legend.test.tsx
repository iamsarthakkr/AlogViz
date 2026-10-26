import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Legend } from '@/ui/Legend';

describe('Legend', () => {
    it('is a labelled side region the page can place', () => {
        render(<Legend className="[grid-area:legend]" />);
        const region = screen.getByRole('complementary', { name: 'Legend' });
        expect(region).toHaveClass('[grid-area:legend]');
        expect(region).toHaveTextContent('Legend');
    });
});
