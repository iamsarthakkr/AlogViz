# Features

What the app does today, ordered core-first. For *how* each is implemented in depth, see
[ARCHITECTURE.md](./ARCHITECTURE.md).

## 1. Interactive wall-painting grid

The core surface: a canvas grid (`features/CanvasGrid`) of empty/wall cells. Click-drag with
the left mouse button (or plain touch/pen) paints walls; right-click-drag (or Alt+drag)
erases them. A single continuous drag paints every cell it crosses without re-triggering per
cell if the cell is already the target kind.

- Implementation: `CanvasGrid.tsx`'s pointer handlers (`onPointerDown/Move/Up`) compute the
  hit cell from client coordinates, choose a `Brush` (`Wall`/`Erase`) from the mouse
  button/modifier key, and write into `useGridStore` via `setCell` + a batched `refresh()`.
- Interacts with: the base canvas layer redraws via `drawBaseScene` any time grid state
  changes; a running algorithm locks the grid (`gridLock`) so painting is disabled mid-run.

## 2. Start/goal markers

Two special cells — start (arrow glyph) and goal (ringed dot) — are draggable by
click-and-hold directly on them. Dropping a marker onto (or near) a wall snaps it to the
nearest empty cell via a small internal BFS rather than landing inside a wall. A marker can't
be dropped on top of the other marker.

- Implementation: `DragMode.MoveStart`/`MoveGoal` in `CanvasGrid.tsx`'s pointer state
  machine; snapping logic lives in `useGridStore.setStart`/`setGoal` calling
  `utils/grid.ts:nearestEmptyCell`.
- Interacts with: algorithms won't run without both markers present on non-wall cells
  (`getGridSnapshot` returns `null` if `validStart()`/`validGoal()` fail, which silently
  no-ops Visualize/Step); maze generation temporarily hides both markers (see §4) and restores
  them afterward, re-snapping if the maze happened to wall over their old position.

## 3. Pathfinding algorithms (Visualize / Step / Pause / Skip-to-end / Clear)

Four algorithms, selectable from the "Algorithm" dropdown in the toolbar
(`features/algo/index.ts`):

| Algorithm | File | Notes |
|---|---|---|
| Breadth-first search | `bfs.ts` | Guarantees shortest path (unweighted); ring-buffer `Queue`. |
| Depth-first search | `dfs.ts` | Explores greedily, does **not** guarantee shortest path; explicit array-as-stack. |
| Bidirectional BFS | `bidirectionalBfs.ts` | Two BFS frontiers grown from start and goal simultaneously, meeting in the middle; typically visits fewer cells than plain BFS. |
| Dijkstra's | `dijkstra.ts` | Binary min-heap priority queue (`store/priority_queue.ts`); currently uniform edge weight (no weighted terrain yet — see ROADMAP.md). |

Each algorithm is a generator that yields one event per unit of work
(`enqueue`/`visit`/final `path`) rather than computing the answer up front — this is what
enables every control below without algorithm-specific code:

- **Visualize** (play): runs the generator at the selected speed via a `requestAnimationFrame`
  loop, painting `frontier`/`visited` colors onto the overlay canvas as events arrive, then
  animates the final path cell-by-cell once found.
- **Pause**: stops the playback loop mid-run without losing generator state; the same button
  slot becomes **Step** when not running.
- **Step**: advances exactly one event and re-pauses — useful for inspecting algorithm
  behavior one cell at a time.
- **Skip-to-end**: (available programmatically via `algoController.skipToEnd`, e.g. triggered
  automatically when the grid changes after a run had already completed) drains the rest of
  the generator instantly and paints the final path with no animation.
- **Clear path**: discards the current run's progress, rebuilds a fresh (not-yet-started)
  generator for the selected algorithm from the live grid, and clears the overlay canvas.
- **Speed**: `slow` / `medium` / `fast` presets (`utils/settings.ts:speedToEPS` → 80 / 220 /
  600 simulated events per second), changeable live, mid-run, without restarting.

Switching the selected algorithm mid-session preserves each algorithm's own progress
independently (each has its own cached generator+runner) — flipping back to a previously-run
algorithm resumes/redisplays where it left off rather than restarting, *unless* the grid
changed in the meantime, in which case it's rebuilt from the new grid on next display.

Editing the grid (walls/markers) while a **finished** visualization is showing automatically
re-solves and re-draws the path instantly (no animation replay, no need to press Visualize
again) — editing while a run is **in progress** simply invalidates it; the user presses
Visualize again to replay against the new grid.

## 4. Maze & pattern generation

A second dropdown ("Mazes & Patterns", `features/mazes/index.ts`) fills the grid with a
generated wall pattern, animated the same way algorithms are (generator + `requestAnimationFrame`
runner), but writing directly into the grid store instead of a canvas overlay:

| Pattern | File | Technique |
|---|---|---|
| Recursive Division | `recursiveDivision.ts` (`vertical_prob=0.5`) | Recursively bisects the interior with single-gap walls, unbiased direction choice. |
| Recursive Division (vertical skew) | same file (`vertical_prob=0.7`) | Same algorithm, biased toward vertical dividing walls → more horizontally elongated chambers. |
| Recursive Division (horizontal skew) | same file (`vertical_prob=0.3`) | Biased toward horizontal dividing walls. |
| Prim's | `prims.ts` | Randomized minimum-spanning-tree carve over the odd/odd cell lattice. |
| Randomized Depth First Search | `floodFill.ts` | Iterative backtracking carve (classic "growing tree" maze). |
| Random Walls | `random.ts` | Independent per-cell coin flip (35% wall probability), no connectivity guarantee. |

Behavior common to all patterns:
- Generating a maze first calls `algoController.clear()` (discarding any visualized path so
  it doesn't linger under the new walls), then hides the start/goal markers and **locks the
  grid** for the duration of generation, then restores the markers (re-snapped off any wall
  the maze happened to place under them) and unlocks the grid once the generator's terminal
  `done` event fires.
- Generation always autoplays at a fixed internal speed (120 events/sec) — there's no
  pause/step exposed for maze generation from the toolbar, unlike algorithm playback.
- Recursive Division's three toolbar entries come from a single implementation parameterized
  by a probability, rather than three separate files — a useful pattern to mirror for future
  maze variants that only differ by a tunable parameter.

## 5. Live run stats

While an algorithm is selected/running, `useAlgoController` tracks and exposes:
- `visitedApprox` — count of cells visited so far (increments on every `visit` event).
- `pathLen` — length of the final path once found (`0` if the generator finishes without ever
  yielding a `path` with nodes, i.e. no path exists).
- `status` — `idle | ready | running | paused | done`.

These are currently computed and available on the controller but not all surfaced in the
toolbar UI (`AlgoControls.tsx` reads `status` and `speed` for button state/labels; `pathLen`
and `visitedApprox` are plumbed through but not currently rendered as visible text anywhere).

## 6. Responsive canvas rendering (crisp at any zoom/DPI)

Both canvas layers (base + overlay) are sized for `window.devicePixelRatio`, so grid lines and
markers stay crisp on high-DPI (Retina) displays instead of blurring. This is infrastructural
rather than user-facing, but shapes what "adding a new visual element" requires (draw at
logical, not physical, pixel coordinates — the DPR scale is baked into the canvas transform
once at setup).

## 7. Grid settings (rows / columns / cell size) — implemented but not currently reachable

A full settings modal (`features/Toolbar/Settings.tsx`) exists for editing row count, column
count, and cell size in pixels (draft values validated/clamped, applied atomically on
"Apply"), backed by `useGridStore.setDimensions`/`setCellSize`. **It is not currently
rendered anywhere in the app** (not exported from `Toolbar/index.ts`, not mounted by
`Toolbar.tsx`) — see [ROADMAP.md](./ROADMAP.md) High #3. Until it's wired up, grid dimensions
are fixed at the `utils/constants.ts` defaults (35 rows × 61 cols × 20px cells).
