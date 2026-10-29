// Authored by - Sarthak Kumar
//
// Stats: the active run's algorithm, status, visited count and path length (in steps, i.e. path
// cells minus one; "No path" when the run finished without reaching the goal).
// - Pure: Grid.tsx passes the controller's values as props
// - Every item renders in every state, with "-" placeholders: on phones this panel is an `auto` grid
//   row, so items appearing mid-run would change its height, resize the grid and stop the run
// - Only the status is aria-live; the visited count changes every frame and would flood a screen reader

import { AlgoStatus } from '@/types/algo';

type Props = {
    algo: string;
    status: AlgoStatus | undefined;
    visited: number;
    pathLen: number | undefined;
    className?: string;
};

const StatusLabels: Record<AlgoStatus, string> = {
    [AlgoStatus.initial]: 'Ready',
    [AlgoStatus.running]: 'Running',
    [AlgoStatus.paused]: 'Paused',
    [AlgoStatus.done]: 'Finished',
};

export const Stats = ({ algo, status, visited, pathLen, className = '' }: Props) => {
    const noPath = status === AlgoStatus.done && pathLen === 0;
    return (
        <aside aria-label="Stats" className={`${className} flex xl:flex-col items-center justify-center`}>
            <h2 className="hidden xl:block xl:text-lg font-semibold mb-2">Stats</h2>
            <dl className="grid grid-cols-4 gap-2 text-center w-full xl:grid-cols-1 xl:text-left">
                <div className="min-w-0">
                    <dt className="text-xs opacity-70">Algo</dt>
                    <dd className="text-sm xl:text-base font-semibold xl:whitespace-normal truncate">{algo || '-'}</dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs opacity-70">Status</dt>
                    <dd className="text-sm xl:text-base font-semibold xl:whitespace-normal truncate" aria-live="polite">
                        {status === undefined ? '-' : StatusLabels[status]}
                    </dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs opacity-70">Visited</dt>
                    <dd className="text-sm xl:text-base font-semibold tabular-nums truncate">{visited}</dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs opacity-70">Path</dt>
                    <dd className="text-sm xl:text-base font-semibold tabular-nums truncate">
                        {pathLen === undefined ? '-' : noPath ? 'No path' : pathLen - 1}
                    </dd>
                </div>
            </dl>
        </aside>
    );
};
