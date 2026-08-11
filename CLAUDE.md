# AlgoViz — Project Context

> This file is the entry point for working in this codebase. For deeper detail see
> [ARCHITECTURE.md](./ARCHITECTURE.md) (state/render/animation internals),
> [FEATURES.md](./FEATURES.md) (what the app does, feature by feature), and
> [ROADMAP.md](./ROADMAP.md) (what's left, categorized bugs/issues).

## What this project is

AlgoViz is a pathfinding-algorithm visualizer. The user paints walls on a grid, places a
start/goal marker, picks an algorithm (BFS, DFS, Bidirectional BFS, Dijkstra's) and/or a
maze generator (Recursive Division, Prim's, randomized DFS flood-fill, random walls), and
watches the algorithm explore the grid cell-by-cell in an animated overlay, ending with the
traced shortest/found path.

It's a single-page canvas app: one real route (`/grid`), one Zustand store for grid data,
one for UI/settings, and a generator-based "algorithm as a sequence of yielded events"
pattern that both pathfinding algorithms and maze generators share.

## Tech stack

- **Next.js 15** (App Router, Turbopack dev server), **React 19**
- **TypeScript**, strict mode
- **Zustand 5** for state (two stores, no middleware/persistence)
- **Tailwind CSS 4** + **daisyUI 5** (`d-` prefixed classes) for chrome (toolbar, dropdown, settings modal); the grid itself is drawn on `<canvas>`, not DOM
- **Prettier** + ESLint (flat config, `eslint-config-next`)
- Path aliases (`tsconfig.json`): `@/*` → `src/*`, `@features/*` → `src/features/*`, `@ui/*` → `src/ui/*`

No test framework is configured. No backend/API/database — everything is client-side, in-memory, and non-persistent (a refresh resets the grid).

## Running it

```bash
npm install
npm run dev     # Turbopack dev server
npm run build
npm run start
npm run lint
```

The visualizer lives at `/grid`. The root route `/` is currently an unmodified
`create-next-app` placeholder ("Hello world") and does not link to `/grid` — see
[ROADMAP.md](./ROADMAP.md) for this and other known gaps.

## Directory map

```
src/
  app/                 Next.js App Router pages (layout, /, /grid)
  ui/Grid.tsx           Top-level page composition: Toolbar + CanvasGrid
  components/           Generic, feature-agnostic UI (CanvasStage + its hook, Dropdown)
  features/
    store/               Zustand stores: useGridStore (grid data), useSettingsStore (UI state)
    CanvasGrid/          The interactive canvas: pointer handling, base-layer draw scheduling
    painters/            Pure canvas-drawing functions (base scene, overlay/algo events, palette)
    algo/                Pathfinding algorithms as generator functions (bfs, dfs, dijkstra, ...)
    mazes/               Maze/pattern generators as generator functions (prims, recursiveDivision, ...)
    animations/          The generator "runner" (rAF playback engine) + hooks that drive algo/maze runs
    Toolbar/             Algorithm/maze dropdowns, play/pause/step/clear, speed control
    hooks/useRaf.ts      Generic "coalesce into one rAF callback" hook
    Canvas/              NOT USED — dead duplicate of components/CanvasStage, see ROADMAP.md
  store/                 Plain (non-Zustand) data structures: ring-buffer Queue, binary min-heap
  types/                 Shared TypeScript types (grid, algo, mazeGenerator, settings, common)
  utils/                 Small pure helpers (grid init/snap, clamp, speed presets, constants)
```

Note: there are **two unrelated things called "store"** in this repo — `src/store/` (data
structures: `Queue`, `min_priority_queue`) and `src/features/store/` (Zustand app state). Don't
confuse them when navigating.

## Core architectural idea

Both pathfinding algorithms and maze generators are plain **JS generator functions** that
`yield` small event objects describing one step of work (`{type:'visit', at}`,
`{type:'carve', at}`, etc.) instead of returning a finished result. A generic **runner**
(`features/animations/runner.ts`) pulls events out of the generator on a
`requestAnimationFrame` loop at a configurable events-per-second rate, and a callback paints
each event onto canvas (algorithms) or writes it into the grid store (mazes). This is what
makes play/pause/step/skip-to-end and speed control "free" — they're all just runner
controls, not algorithm-specific code. See ARCHITECTURE.md for the full flow.

Adding a new algorithm or maze generator is meant to be "write one generator file, register
it in an index.ts map" — see ROADMAP.md for what's still needed to make that fully true in
practice (some duplication and gaps remain).

## Conventions actually used in this codebase

- Algorithms/mazes register themselves in a `Record<string, T>` plus a parallel `string[]`
  labels array in the corresponding `features/<x>/index.ts` (e.g. `algorithms` +
  `algoLabels` in `features/algo/index.ts`). Keep both in sync when adding one.
- Grid coordinates are `{r, c}` (`Coord`), flattened to a 1D index via `r * cols + c`
  everywhere (grid store, algorithms, mazes, painters) — there is no 2D array anywhere.
- Two canvases are stacked per grid: a **base** layer (cells/walls/markers, redrawn on grid
  state changes) and an **overlay** layer (frontier/visited/path, painted directly and
  imperatively by the runner's event callback, bypassing React re-renders for performance).
- `gridLock` (in `useGridStore`) is the mechanism that disables pointer editing while an
  algorithm or maze generator is running.
- Component/hook pairs follow a `Thing.tsx` + `useThing.ts` split with a barrel `index.ts`
  re-exporting the public surface (see `CanvasGrid/`, `Canvas/`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
