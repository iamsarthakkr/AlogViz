'use client';

import React, { useEffect } from 'react';
import { useGridStore } from '@/features/grid/store/useGridStore';
import { speedToEPS } from '@features/grid/utils';
import { AlgoController } from '@features/grid/animations/useAlgoController';
import { useSettingsStore } from '../store/useSettingsStore';
import { SpeedPreset } from '../types';

type Props = {
    algorithms: string[];
    algoController: AlgoController;
};

const Settings = () => {
    const {
        isSettingsOpen,
        openSettings,
        closeSettings,
        rowsDraft,
        colsDraft,
        cellSizeDraft,
        setDraftRows,
        setDraftCols,
        setDraftCell,
    } = useSettingsStore((s) => s);

    const rows = useGridStore((s) => s.rows);
    const cols = useGridStore((s) => s.cols);
    const cellSize = useGridStore((s) => s.cellSize);
    const setDimensions = useGridStore((s) => s.setDimensions);
    const setCellSize = useGridStore((s) => s.setCellSize);

    // handlers

    const onOpenSettings = () => openSettings(rows, cols, cellSize);

    const onApplySettings = () => {
        setDimensions(rowsDraft, colsDraft);
        setCellSize(cellSizeDraft);
        closeSettings();
    };

    return (
        <div className="w-full bg-white/80 backdrop-blur border-b border-gray-200">
            <div className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-3">
                {/* Title */}
                <div className="text-lg font-semibold tracking-tight mr-2">AlgoViz</div>

                {/* Settings */}
                <button
                    className="ml-2 p-2 rounded-md border border-gray-300 hover:bg-gray-50"
                    onClick={onOpenSettings}
                    title="Settings"
                    aria-label="Settings"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
                        <path
                            fill="currentColor"
                            d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m8.94 4a7 7 0 0 0-.14-1.5l2.12-1.65l-2-3.46l-2.49 1a7 7 0 0 0-2.6-1.5l-.39-2.65h-4l-.39 2.65a7 7 0 0 0-2.6 1.5l-2.49-1l-2 3.46l2.12 1.65A7 7 0 0 0 3.06 12a7 7 0 0 0 .14 1.5L1.08 15.15l2 3.46l2.49-1a7 7 0 0 0 2.6 1.5l.39 2.65h4l.39-2.65a7 7 0 0 0 2.6-1.5l2.49 1l2-3.46l-2.12-1.65c.09-.49.14-1 .14-1.5Z"
                        />
                    </svg>
                </button>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={closeSettings} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-4">
                        <div className="text-base font-medium mb-3">Grid Settings</div>
                        <div className="grid grid-cols-3 gap-3">
                            <label className="text-sm text-gray-600 col-span-1 self-center">Rows</label>
                            <input
                                type="number"
                                className="col-span-2 border border-gray-300 rounded-md px-2 py-1"
                                min={2}
                                max={300}
                                value={rowsDraft}
                                onChange={(e) => setDraftRows(Number(e.target.value))}
                            />
                            <label className="text-sm text-gray-600 col-span-1 self-center">Cols</label>
                            <input
                                type="number"
                                className="col-span-2 border border-gray-300 rounded-md px-2 py-1"
                                min={2}
                                max={300}
                                value={colsDraft}
                                onChange={(e) => setDraftCols(Number(e.target.value))}
                            />
                            <label className="text-sm text-gray-600 col-span-1 self-center">Cell size</label>
                            <input
                                type="number"
                                className="col-span-2 border border-gray-300 rounded-md px-2 py-1"
                                min={8}
                                max={64}
                                value={cellSizeDraft}
                                onChange={(e) => setDraftCell(Number(e.target.value))}
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="px-3 py-1.5 text-sm rounded-md border border-gray-300"
                                onClick={closeSettings}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:brightness-95"
                                onClick={onApplySettings}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
