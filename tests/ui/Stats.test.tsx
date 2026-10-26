import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stats } from '@/ui/Stats';

describe('Stats', () => {
    it('is a labelled side region the page can place', () => {
        render(<Stats className="[grid-area:stats]" />);
        const region = screen.getByRole('complementary', { name: 'Stats' });
        expect(region).toHaveClass('[grid-area:stats]');
        expect(region).toHaveTextContent('Stats');
    });
});
