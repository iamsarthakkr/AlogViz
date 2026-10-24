import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App', () => {
    it('renders the visualizer: toolbar plus the two grid canvases', () => {
        const { container } = render(<App />);
        expect(screen.getByText('AlgoViz')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Visualize' })).toBeInTheDocument();
        expect(container.querySelectorAll('canvas')).toHaveLength(2);
    });
});
