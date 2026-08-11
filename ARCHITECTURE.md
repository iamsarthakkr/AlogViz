# Architecture

Deep dive into state management, component wiring, and the run → animate → render pipeline.
See [CLAUDE.md](./CLAUDE.md) for the high-level map and [FEATURES.md](./FEATURES.md) for
feature-level behavior.

## 1. Page composition

```
app/grid/page.tsx  ('use client')
  └─ ui/Grid.tsx
       ├─ Toolbar (ctx = ref to CanvasGrid)
       │    └─ AlgoControls (ctx)
       │         ├─ Dropdown (algorithm select)
       │         ├─ Dropdown (maze/pattern select)
       │         ├─ Visualize / Pause / Step buttons
       │         ├─ Clear path button
       │         └─ Dropdown (speed select)
       └─ CanvasGrid (forwardRef → CanvasGridHandle)
            └─ CanvasStage (forwardRef → CanvasStageHandle)
                 ├─ <canvas> base   (useCanvasLayer)
                 └─ <canvas> overlay (useCanvasLayer)
```

`ui/Grid.tsx` holds a single `gridRef` (`useRef<CanvasGridHandle>`) and passes it to both
`Toolbar` and `CanvasGrid`. This ref is the *only* wiring between the toolbar's controls and
the canvas — there is no prop/callback chain for draw commands. `AlgoControls` forwards the
same ref into `useAlgoController(ctx, algorithms)`, which uses
`ctx.current.getOverlayCtx()` / `clearOverlay()` to paint directly.

## 2. State management

Two independent Zustand stores, no shared slice, no middleware (no persist/devtools).

### `useGridStore` (`features/store/useGridStore.ts`) — the grid's source of truth

```ts
type Grid = {
  gridVersion: number;   // bumped on every structural edit; the invalidation signal
  rows, cols, cellSize: number;
  cells: CellKind[];     // flat array, index = r*cols+c, CellKind.empty | CellKind.wall
  start, goal: Coord;    // {r:-1,c:-1} is the sentinel for "removed" (used during maze gen)
  gridLock: boolean;     // true while an algorithm/maze run owns the grid
}
```

Plus derived helpers (`idx`, `inBounds`, `at`, `validStart`, `validGoal`) and mutators
(`setDimensions`, `setCellSize`, `setCell`, `clearWalls`, `fillWalls`, `setStart`, `setGoal`,
`setGridLock`, `refresh`, `reset`).

Key behaviors baked into the mutators:
- `setCell` refuses to overwrite the start/goal cell, and no-ops if the value is unchanged
  (so `refresh()`/re-renders aren't triggered for redundant paints).
- `setStart`/`setGoal` **snap** to the nearest non-wall cell via a small BFS
  (`utils/grid.ts:nearestEmptyCell`) whenever the target cell would land on a wall, and
  refuse the move if it would collide with the other marker.
- `setStart(-1,-1)` / `setGoal(-1,-1)` (negative coords) is the "no marker" sentinel used by
  `useMazeGenerator` to hide start/goal while carving.
- `refresh()` is the manual dirty flag — most mutators don't bump `gridVersion` themselves;
  callers (`CanvasGrid`'s pointer handlers) call `api.refresh()` after a batch of `setCell`
  calls so a drag-paint doesn't trigger one version bump per cell.
- `setDimensions` clamps rows/cols to `[2,300]`, clamps existing start/goal into the new
  bounds, and nudges goal off start if a resize collapsed them onto the same cell.

`GridSnapShot` (= `Grid`, no methods) is what gets handed to algorithms/mazes — a frozen,
plain-data copy so a generator's view of the grid can't be mutated mid-run by further
pointer input (see §4).

### `useSettingsStore` (`features/store/useSettingsStore.ts`) — UI/session state

`algoKey`, `speed` (`'slow'|'medium'|'fast'`), the Settings-modal draft fields
(`rowsDraft`/`colsDraft`/`cellSizeDraft` + open/close), and `mazeGeneratorKey`. This store is
mostly cosmetic bookkeeping for dropdown labels; the actual runner speed lives in
`useAlgoController`'s own `speed` state (converted from the preset via
`utils/settings.ts:speedToEPS`).

### State that intentionally lives outside Zustand

High-frequency/imperative state is kept in `useRef`/local `useState` inside hooks rather than
in a store, because it changes many times per second during playback and/or must survive
across renders without forcing re-renders:
- `useAlgoController`: `runners` (a `Map<algoKey, {runner, buildVersion}>` — one cached
  generator+runner per algorithm so switching algorithms doesn't lose progress),
  `currentKeyRef`, `cancelPathAnimRef`, `sawPathEventRef`, `speedRef`.
- `useMazeGenerator`: `runnerRef`, a cleanup closure ref that restores start/goal.
- `CanvasGrid`: `dragMode` (paint / move-start / move-goal), `brushRef` (wall vs erase).

## 3. Canvas rendering layer

`components/useCanvasLayer.ts` is the low-level hook: given `rows/cols/cellSize`, it sizes a
`<canvas>` for devicePixelRatio (`ctx.setTransform(dpr,0,0,dpr,0,0)`, disables image
smoothing for crisp cell edges) and exposes `getCtx()`. `components/CanvasStage.tsx` stacks
two of these — `base` (pointer-events auto) and `overlay` (`pointer-events: none`,
absolutely positioned on top) — and exposes both contexts via `useImperativeHandle`.

> **Dead code**: `features/Canvas/` (`Canvas.tsx` + `useCanvas.ts` + `types.ts`) is a
> byte-for-byte-similar duplicate of `components/CanvasStage` + `useCanvasLayer`, but it is
> never imported anywhere in the app (`CanvasGrid` imports `CanvasStage` from
> `@/components/CanvasStage`). Treat `components/CanvasStage` as canonical. See ROADMAP.md.

`features/CanvasGrid/CanvasGrid.tsx` owns a `CanvasStage` and is the thing everything else
talks to:
- Subscribes to `useGridStore` with `useShallow` for `[rows, cols, cellSize, cells, start, goal]`.
- Two `useEffect`s, each debounced through `useRaf()` (coalesces multiple state changes
  within one animation frame into a single draw call):
  1. redraw the **base** layer via `painters.drawBaseScene(...)` whenever grid data changes.
  2. **clear** the overlay layer whenever grid *dimensions* change (`rows/cols/cellSize` —
     note this effect's deps are narrower than the base-redraw effect's).
- Exposes `CanvasGridHandle` (`getBaseCtx`, `getOverlayCtx`, `clearOverlay`, `redrawBase`) via
  `useImperativeHandle` — this is the handle `ui/Grid.tsx` holds and passes to `Toolbar`.
- Owns all pointer interaction (see §5).

### Painters (`features/painters/`) — pure drawing functions, no state

- `basePainter.ts`: `drawBaseScene` = clear+fill background → paint every cell (wall/empty
  color, with a 0.25px overdraw fudge to avoid antialiasing seams between adjacent same-kind
  cells) → `drawGridLines` (skips the line segment between two adjacent wall cells, so wall
  blocks render as solid contiguous shapes) → outer border → `drawMarkers` (start = arrow
  glyph, goal = ringed dot).
- `overlayPainter.ts`: `paintAlgoEvent` switches on `AlgoEvent.type` and fills one cell
  (`frontier` color for `enqueue`, `visited` color for `visit`); `path` events are only
  instant-painted if `drawPathInstant` is passed (otherwise the runner leaves it to
  `animateFinalPath`). `animateFinalPath` runs its **own independent rAF loop** (not the
  generator runner) that fills `nps` (nodes-per-second, default 240) path cells per second
  until done, returning a cancel function. `clearOverlay` is a plain `ctx.clearRect`.
- `colors.ts`: `GridPalette` with a `lightPalette` and `darkPalette`. **`darkPalette` is
  currently identical to `lightPalette`**, and both painter modules hardcode
  `import { lightPalette as palette }` — there is no theme-switching logic anywhere in the
  app despite the two-palette scaffold. See ROADMAP.md.

## 4. Algorithms & the event-generator pattern

`types/algo.ts`:
```ts
type AlgoEvent = {type:'enqueue', at:Coord} | {type:'visit', at:Coord} | {type:'path', nodes:Coord[], visited:number};
type PathFinder = (grid: GridSnapShot) => Generator<AlgoEvent, void, void>;
```

Every algorithm in `features/algo/*.ts` (`bfs`, `dfs`, `dijkstra`, `bidirectionalBfs`) is a
generator function matching `PathFinder`. Shape is consistent across all four:
1. Build local closures over the snapshot: `id(coord)`, `inb(coord)`, `isWall(coord)`,
   `getCoord(id)` — **re-implemented per file** rather than shared (see ROADMAP.md).
2. Seed the frontier structure (`Queue` for bfs/bidirectional, plain array-as-stack for dfs,
   `min_priority_queue` binary heap for dijkstra), `yield {type:'enqueue', at:start}`.
3. Main loop: pop next node, `yield {type:'visit', ...}`, expand `neighbors4` (4-directional,
   `features/algo/utils.ts`), track `seen`/`dist` in typed arrays (`Uint8Array`/`Int32Array`
   sized `rows*cols`) and `parent` pointers for path reconstruction, `yield {type:'enqueue'}`
   for each newly-discovered neighbor, stop early the instant `goal` is reached.
4. Reconstruct the path by walking `parent` back from `goal`, reverse it, and
   `yield {type:'path', nodes, visited}` exactly once, as the generator's final yield.

`dijkstra` currently uses a uniform edge weight of `1` for every step (`const w = 1`) — with
no weighted-terrain cell kind in the grid, it is behaviorally equivalent to BFS but pays heap
overhead; see ROADMAP.md.

`bidirectionalBfs` runs two independent BFS frontiers (`queue[0]` from start, `queue[1]` from
goal) in lockstep, alternating one pop per frontier per outer loop iteration, and stops the
instant a node expanded by one side is already `seen` by the other (`mid`). The path is
stitched by walking `parent[0]` back from `mid` to start (reversed) then `parent[1]` forward
from `mid` to goal.

Algorithms are pure functions of the snapshot — they never touch Zustand directly. All
grid-store interaction happens in the runner's event callback (`useAlgoController`), which is
what lets `getGridSnapshot()` (`features/animations/utils.ts`) safely `.slice()` the cells
array once up front and hand algorithms an immutable view.

## 5. Maze generators & the same pattern, different event set

`types/mazeGenerator.ts`:
```ts
type MazeGeneratorEvent = {type:'fill-wall'} | {type:'clear-wall'} | {type:'carve', at:Coord} | {type:'wall', at:Coord} | {type:'done'};
type MazeGenerator = (rows: number, cols: number) => Generator<MazeGeneratorEvent, void, void>;
```

`features/mazes/*.ts`:
- `random.ts` (`randomGenerator`): clears walls, then for every even-coordinate-skip cell,
  probabilistically emits a `wall` event (`wall_prob = 0.35`).
- `floodFill.ts`: fills walls, then a randomized iterative DFS backtracker over the
  "odd/odd" cell lattice (standard maze-on-a-grid technique — real cells sit at odd
  coordinates, walls between them at even coordinates), carving the midpoint wall + the new
  cell as it advances, backtracking via a stack when a cell has no unvisited neighbors.
- `prims.ts`: fills walls, randomized Prim's algorithm over the same odd/odd lattice —
  maintains a `frontiers` list of candidate walls, randomly picks one, carves it plus the
  cell on the far side if that cell is unvisited.
- `recursiveDivision.ts`: **a factory**, `recursiveDivision(vertical_prob = 0.5) => MazeGenerator`.
  Clears walls, draws the outer boundary, then recursively bisects the interior with a
  vertical or horizontal wall (weighted by `vertical_prob`) that has exactly one carved gap,
  pushing the two sub-chambers onto explicit stacks (`row_stack`/`col_stack`) instead of
  recursing, until a chamber is too small to divide further. `mazes/index.ts` calls this
  factory three times with different skew probabilities (0.5 default, 0.7 vertical-skewed,
  0.3 horizontal-skewed) to register three distinct maze options from one implementation.

All maze generators operate on the *lattice coordinates directly* (no `GridSnapShot`
needed since they don't read existing walls) — they take `(rows, cols)` and yield
coordinate-only events, which is why `useMazeGenerator` can restore/relocate start & goal
independently after the run.

## 6. The runner — generic playback engine

`features/animations/runner.ts:createRunner<TYield>(gen, onEvent, opts)`. This is the single
piece of code that both algorithms and mazes are played back through; neither `AlgoEvent` nor
`MazeGeneratorEvent` are known to it — it's generic over `TYield`.

- Converts a `speed` (events-per-second, default 120) into `perFrame = ceil(eps/60)`, clamped
  to `maxBatchPerFrame` (default 1000), assuming a 60Hz `requestAnimationFrame` cadence.
- `play()`: sets `running=true`, schedules `tick` via rAF. Each `tick` pulls up to `perFrame`
  events from the generator synchronously, calling `onEvent(value)` for each, then
  re-schedules itself — until the generator reports `done`, at which point it calls
  `opts.onFinish?.()`.
- `pause()`: cancels the rAF and flips `running=false` (generator position is preserved —
  resuming continues exactly where it left off, since it's a real JS generator).
- `step()`: pulls exactly one event, independent of `running` state.
- `skipToEnd()`: drains the generator synchronously in a `while` loop (no rAF), firing
  `onEvent` for every remaining event — this is what makes "grid edited while a finished
  algorithm's overlay is stale" resolve instantly rather than by dropping frames.
- `setSpeed(eps)`: updates the closure variable read by the next `tick`; takes effect
  immediately, no restart needed.
- `getStatus()` mirrors `AlgoStatus` (`initial|running|paused|done`).

## 7. `useAlgoController` — orchestrates algorithm playback

This is the biggest piece of glue. Responsibilities:
- **Runner cache**: `runners: Map<algoKey, {runner, buildVersion}>`. Switching the selected
  algorithm (`setAlgorithm`) does *not* discard other algorithms' progress — each key keeps
  its own generator+runner until the grid changes underneath it.
- **Grid-version invalidation**: `getOrCreateCurrent()` compares the cached runner's
  `buildVersion` against the live `gridVersion` (from `useGridStore`); a mismatch triggers a
  fresh `createRunnerFor`. A separate `useEffect` watches `gridVersion` directly: if the
  *currently displayed* algorithm's cached build is stale, it immediately rebuilds — and if
  the old runner had already finished (`AlgoStatus.done`), the rebuild is played back
  **instantly** (`instant=true` → `drawPathInstant` + `r.skipToEnd()`) so editing the grid
  after a completed run doesn't require re-clicking Visualize to see the corrected path.
- **Event → paint wiring** (`getEventHandler`): grabs the overlay ctx once per snapshot, and
  returns a closure that calls `paintAlgoEvent` for every event, tracks `visitedApprox`
  (incremented on `visit`), and on the terminal `path` event: sets `pathLen`, unlocks the
  grid (`setGridLock(false)`), and — unless `instant` — cancels any prior path animation and
  starts a new one via `animateFinalPath`, whose per-frame callback keeps the start/goal
  markers redrawn on top (since the overlay animation paints over them cell-by-cell).
- **Status state machine**: `'idle' | 'ready' | 'running' | 'paused' | 'done'`, exposed to the
  toolbar. `play()` locks the grid; `pause()`/finishing unlocks it.
- **`clear()`**: pauses the current runner, rebuilds it fresh from the current snapshot
  (resets `visitedApprox`/`pathLen`), and clears the overlay — used both by the toolbar's
  "Clear path" button and internally before starting a maze generation.
- Cleanup on unmount pauses every cached runner and cancels any in-flight path animation.

## 8. `useMazeGenerator` — orchestrates maze playback

Simpler and structurally different from the algorithm controller: it drives events straight
into `useGridStore` mutators instead of a canvas painter, because maze cells *are* grid
state (walls), not an overlay.

Sequence on `generate(key)`:
1. Pause/discard any previous maze runner + pending cleanup closure.
2. Snapshot current start/goal, then **remove markers** (`setStart(-1,-1)`, `setGoal(-1,-1)`)
   and **lock the grid** — this both hides the markers during carving and stops the player
   from painting walls mid-generation.
3. Build the generator from `(rows, cols)` and wrap it in `createRunner`, whose `onEvent`
   applies `fillWalls`/`clearWalls`/`setCell(..., wall|empty)` directly for each event type.
4. On the generator's `done` event, run the stored cleanup closure: restore the original
   start/goal coordinates (re-snapped through `setStart`/`setGoal`'s nearest-empty-cell logic
   if the maze happened to wall over them), unlock the grid, and `refresh()`.
5. `runnerRef.current.play()` — maze generation always autoplays (no pause/step controls are
   wired to it from the toolbar; `AlgoControls.onGenerateMaze` also calls
   `algoController.clear()` first so a stale path overlay doesn't linger under the new maze).

## 9. Pointer interaction (`CanvasGrid`)

Single-pointer state machine via `DragMode` (`None | Paint | MoveStart | MoveGoal`), driven
by native Pointer Events (`onPointerDown/Move/Up/Leave`) with `setPointerCapture` so drags
tracked outside the canvas bounds still deliver move events.

- `hitCell(e)`: converts client coords to `{r,c}` via the wrapper's bounding rect and
  `cellSize` (no rounding/clamping to grid bounds — out-of-range is filtered by `paintAt`).
- `onPointerDown`: no-ops if `gridLock`. If the hit cell is the start or goal marker, enters
  `MoveStart`/`MoveGoal` drag mode. Otherwise enters `Paint` mode, choosing the brush
  (`Erase` if right mouse button or Alt is held, else `Wall`) and paints immediately.
- `onPointerMove`: continues painting or dragging the active marker per `dragMode`, calling
  `api.refresh()` after every move to bump `gridVersion` (this is what invalidates cached
  algorithm runners live, mid-drag).
- `onPointerUp`/`onPointerLeave`: releases pointer capture, resets `dragMode` to `None`.
- `paintAt`: guards bounds and refuses to paint over the start/goal cell; no-ops if the cell
  is already the target kind (avoids redundant store writes during a drag).
- Right-click context menu is suppressed (`onContextMenu` → `preventDefault`) since
  right-click is repurposed as the erase-brush trigger.

## 10. End-to-end flow: clicking "Visualize"

1. `AlgoControls`'s Visualize button calls `algoController.play()`.
2. `play()` → `getOrCreateCurrent()`: if no cached runner for `algoKey`, or the grid changed
   since it was built, or it already finished, build a fresh one via `createRunnerFor`.
3. `createRunnerFor`: pauses whatever runner was "current", snapshots the grid
   (`getGridSnapshot`, returns `null` if start/goal invalid — controller bails out), clears
   the overlay canvas, instantiates the algorithm generator (`algo(snap)`), wraps it in
   `createRunner` with the current `speedRef` and an `onFinish` fallback, caches it keyed by
   `algoKey` + the snapshot's `gridVersion`.
4. `useGridStore.setGridLock(true)` — pointer painting is now inert.
5. `runner.play()` starts the rAF tick loop; each tick pulls `eps/60` events and invokes the
   `onEvent` closure from `getEventHandler`, which paints `enqueue`/`visit` cells onto the
   **overlay** canvas immediately (no React render involved — this is why the visualization
   can run at high event rates without janking React).
6. When the generator yields its terminal `path` event: grid unlocks, `pathLen`/status update
   (triggers a React re-render of the toolbar only), and `animateFinalPath` takes over with
   its own independent rAF loop to trace the path cell-by-cell at `pathNps` (240/s default),
   re-drawing the start/goal markers on top each frame.
7. Meanwhile the **base** layer is untouched throughout — it only redraws in response to
   `useGridStore` changes (wall edits, marker moves), which is exactly what keeps grid
   editing and algorithm animation on separate, non-interfering render paths.

Editing the grid mid-run: any `setCell`/`setStart`/`setGoal` + `refresh()` bumps
`gridVersion`. The algorithm controller's `useEffect` on `gridVersion` notices next tick,
pauses the stale runner, and rebuilds — if the prior run had already reached `done`, the
rebuild is instantly skipped-to-end so the corrected path reappears without user action;
otherwise it simply restarts from the new snapshot at `initial` status (the user has to press
Visualize again to replay, since an in-flight — not-yet-`done` — run is not auto-replayed).
