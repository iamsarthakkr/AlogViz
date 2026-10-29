import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stats } from '@/ui/Stats';
import { algoLabels } from '@/features/algo';
import { AlgoStatus } from '@/types/algo';

type StatsProps = Parameters<typeof Stats>[0];

// what a run that hasn't started yet looks like
const IDLE: StatsProps = { algo: '', status: undefined, visited: 0, pathLen: undefined };
// a finished run on an open grid: start and goal 4 apart, so 5 path cells
const DONE: StatsProps = { algo: algoLabels[0], status: AlgoStatus.done, visited: 12, pathLen: 5 };

const LABELS = ['Algo', 'Status', 'Visited', 'Path'];
const PLACEHOLDER = /^[-—]$/; // a lone dash: "nothing yet"

const renderStats = (props: Partial<StatsProps> = {}) => render(<Stats {...IDLE} {...props} />);
// the <dd> paired with a <dt> label
const value = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
const labels = () => screen.getAllByRole('term').map((dt) => dt.textContent);

describe('Stats', () => {
    it('is a labelled side region the page can place', () => {
        renderStats({ className: '[grid-area:stats]' });
        expect(screen.getByRole('complementary', { name: 'Stats' })).toHaveClass('[grid-area:stats]');
    });

    // On phones the stats sit in an `auto` grid row: if items appeared or disappeared during a run,
    // the row would change height, the grid would be resized, and the run would stop. jsdom can't
    // measure that, so check the structure: the same items render whatever the state.
    it.each([undefined, AlgoStatus.initial, AlgoStatus.running, AlgoStatus.paused, AlgoStatus.done])(
        'renders the same items when status is %s',
        (status) => {
            renderStats({ ...DONE, status });
            expect(labels()).toEqual(LABELS);
        },
    );

    it('shows placeholders before any run', () => {
        renderStats();
        expect(value('Algo').textContent).toMatch(PLACEHOLDER);
        expect(value('Status').textContent).toMatch(PLACEHOLDER);
        expect(value('Visited')).toHaveTextContent(String(IDLE.visited));
        expect(value('Path').textContent).toMatch(PLACEHOLDER);
    });

    it.each([
        [AlgoStatus.initial, 'Ready'],
        [AlgoStatus.running, 'Running'],
        [AlgoStatus.paused, 'Paused'],
        [AlgoStatus.done, 'Finished'],
    ])('labels status %s as %s', (status, label) => {
        renderStats({ ...DONE, status });
        expect(value('Status')).toHaveTextContent(label);
    });

    it('shows the run’s algorithm and visited count', () => {
        renderStats(DONE);
        expect(value('Algo')).toHaveTextContent(DONE.algo);
        expect(value('Visited')).toHaveTextContent(String(DONE.visited));
    });

    // pathLen counts cells, both endpoints included; a length is the number of moves between them
    it('shows the path length in steps, not cells', () => {
        renderStats(DONE);
        expect(value('Path')).toHaveTextContent(String(DONE.pathLen! - 1));
    });

    it('shows a placeholder for the path until one is found', () => {
        renderStats({ ...DONE, status: AlgoStatus.running, pathLen: undefined });
        expect(value('Path').textContent).toMatch(PLACEHOLDER);
    });

    // the controller reports pathLen 0 when the run finished without reaching the goal; the run
    // still finished, so the status stays "Finished" and the path cell says there is none
    describe('when no path exists', () => {
        const noPath = { ...DONE, pathLen: 0 };

        it('says so in the path cell, not as a negative length', () => {
            renderStats(noPath);
            // 0 cells minus one would read as a path of -1 steps
            expect(value('Path')).toHaveTextContent('No path');
        });

        it('still reports the run as finished', () => {
            renderStats(noPath);
            expect(value('Status')).toHaveTextContent('Finished');
        });
    });

    // status changes are worth announcing; the visited count changes every frame and would flood a
    // screen reader, so only the status is a live region
    it('announces status changes, and only those', () => {
        const { container } = renderStats(DONE);
        const live = container.querySelectorAll('[aria-live]');
        expect(live).toHaveLength(1);
        expect(live[0]).toBe(value('Status'));
        expect(live[0]).toHaveAttribute('aria-live', 'polite');
    });
});
