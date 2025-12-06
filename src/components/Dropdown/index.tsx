import { Callback1 } from '@/types/common';
import React, { useCallback } from 'react';

type Props = {
    title: string;
    options: string[];
    onSelect: Callback1<string>;
    className?: string;
};

export const Dropdown = (props: Props) => {
    const { title, options, onSelect, className = '' } = props;

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
                className="m-1 px-3 py-2 cursor-pointer border-none outline-none rounded-md bg-primary text-white flex items-center justify-center text-sm hover:text-secondary"
            >
                {title}
                <svg
                    className="w-4 h-4 ms-1.5 -me-1.5"
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
                className="d-dropdown-content d-menu py-3 bg-primary text-white rounded-box z-1 mt-4 w-40 p-2 shadow-sm text-xs"
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
