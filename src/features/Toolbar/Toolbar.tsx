'use client';

import React from 'react';
import { AlgoControls } from './AlgoControls';
import { CanvasGridHandle } from '@features/CanvasGrid';

type Props = {
    ctx: React.RefObject<CanvasGridHandle | null>;
    className?: string;
};

export const Toolbar = ({ ctx, className }: Props) => {
    return (
        <div className={`${className} w-full bg-white/80 backdrop-blur border-b border-gray-200`}>
            <div className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-3">
                <div className="text-lg font-semibold tracking-tight mr-2">AlgoViz</div>
                <AlgoControls ctx={ctx} />
            </div>
        </div>
    );
};
