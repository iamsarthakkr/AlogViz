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
        <div className={`${className} w-full bg-primary`}>
            <div className="px-10 w-full flex items-center gap-10">
                <div className="py-3 text-white text-2xl font-semibold tracking-tight">AlgoViz</div>
                <AlgoControls ctx={ctx} />
            </div>
        </div>
    );
};
