import { vi } from 'vitest';

export type FillCall = { style: string; x: number; y: number; w: number; h: number };

export type MockCtx = CanvasRenderingContext2D & {
    fills: FillCall[];
    strokeStyles: string[];
};

// A CanvasRenderingContext2D stand-in that records what was filled and with which colour.
// fillStyle is captured at call time because painters set it right before each fillRect.
export function createMockCtx(): MockCtx {
    const ctx = {
        fills: [] as FillCall[],
        strokeStyles: [] as string[],
        fillStyle: '' as string,
        strokeStyle: '' as string,
        lineWidth: 1,
        lineCap: 'butt',
        imageSmoothingEnabled: true,
        fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
            ctx.fills.push({ style: String(ctx.fillStyle), x, y, w, h });
        }),
        stroke: vi.fn(() => {
            ctx.strokeStyles.push(String(ctx.strokeStyle));
        }),
        clearRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        setTransform: vi.fn(),
    };
    return ctx as unknown as MockCtx;
}
