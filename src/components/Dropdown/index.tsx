// Authored by - Sarthak Kumar
//
// Dropdown: generic daisyUI-styled select menu (title + option list -> onSelect).
// Feature-agnostic — used for algorithm, maze, and speed selection in the toolbar.

import { Callback1 } from '@/types/common';
import { useCallback } from 'react';

type Props = {
    title: React.ReactNode;
    label?: string; // accessible name; needed when the title isn't plain text (e.g. a short form for phones)
    options: string[];
    onSelect: Callback1<string>;
    className?: string; // root: width, and daisyUI placement (d-dropdown-top/-end, responsive variants work)
    menuClassName?: string; // the gap between trigger and menu, on the side the menu opens (default mt-2)
};

export const Dropdown = (props: Props) => {
    const { title, label, options, onSelect, className = '', menuClassName = 'mt-2' } = props;

    const selectItem = useCallback(
        (item: string) => {
            onSelect(item);

            const element = document.activeElement;
            if (element && element instanceof HTMLElement)
                setTimeout(() => {
                    element.blur();
                }, 10);
        },
        [onSelect],
    );

    return (
        <div className={`d-dropdown ${className}`}>
            <div
                tabIndex={0}
                role="button"
                aria-label={label ?? (typeof title === 'string' ? title : undefined)}
                className="w-full min-w-0 px-3 py-2 cursor-pointer border-none outline-none rounded-md bg-primary text-white flex items-center justify-center text-sm hover:text-secondary"
            >
                <span className="truncate">{title}</span>
                <svg
                    className="w-4 h-4 ms-1.5 -me-1.5 shrink-0"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 9-7 7-7-7"
                    />
                </svg>
            </div>
            <ul
                tabIndex={0}
                className={`d-dropdown-content d-menu ${menuClassName} py-3 bg-primary text-white rounded-box z-1 w-40 p-2 shadow-sm text-xs`}
            >
                {options.map((k) => (
                    <li
                        className="py-0 bg-primary text-xs rounded-box hover:bg-primary/80"
                        key={k}
                        onClick={() => selectItem(k)}
                    >
                        <a className="active:bg-primary/90">{k}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};
