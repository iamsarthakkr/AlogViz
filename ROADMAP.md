# Roadmap

Goal: reach a state where adding a new pathfinding algorithm or maze pattern is _only_
"write one generator file + register it in an index.ts map" — no touching hooks, painters,
or types. Then a categorized list of current bugs/issues found while reading the codebase
end to end.

## Path to "just add an algo.ts/generator.ts file"

- [x] Delete `features/Canvas/` (`Canvas.tsx`, `useCanvas.ts`, `types.ts`, `index.ts`) — dead
      duplicate of `components/CanvasStage`, imported nowhere. Confirmed via repo-wide grep.
- [ ] Delete or wire up `features/Toolbar/Settings.tsx` — it's a complete grid-resize UI
      (rows/cols/cell size modal) that is never rendered or exported from
      `Toolbar/index.ts`. Either mount it in `Toolbar.tsx` (the only way today's users can
      resize the grid is by editing `utils/constants.ts` and restarting the dev server) or
      remove it if resize isn't a target feature.
- [ ] Extract the copy-pasted `id`/`inb`/`isWall`/`getCoord` closures out of `bfs.ts`,
      `dfs.ts`, `dijkstra.ts`, `bidirectionalBfs.ts` into `features/algo/utils.ts` (it
      already holds `neighbors4`, `equal`, etc. — natural home). Today, adding an algorithm
      means re-deriving these four helpers by copy-paste, which is exactly the boilerplate
      the "just add a file" goal is supposed to eliminate.
- [ ] Same for the `id`/`inb` pair duplicated across `floodFill.ts`, `prims.ts` (mazes).
- [ ] Give algorithms a declared "requires weighted terrain" capability, or introduce a
      weighted `CellKind` (see High #3 below) — otherwise Dijkstra-family and future A\*/cost
      algorithms have nothing to differentiate them from BFS in this codebase.
- [ ] Define a single `AlgoDefinition`/`MazeDefinition` shape (`{label, run, ...}`) so a new
      algorithm is _one_ export added to _one_ array, instead of updating both a `Record` and
      a parallel `string[]` labels array that must stay in sync by convention
      (`features/algo/index.ts`, `features/mazes/index.ts`).
- [x] Add a lightweight test harness so a new generator can be verified without manual UI
      testing. Vitest lives in `tests/` (mirrors `src/`); `tests/features/algo/index.test.ts`
      and `tests/features/mazes/index.test.ts` run a contract suite over every registered
      algorithm/maze, so registering a new one tests it automatically.
- [ ] Document (in code or ARCHITECTURE.md) the exact generator contract new authors must
      follow: yield order guarantees, that `path` must be the _last_ yield, that coordinates
      must be in-bounds, etc. — currently this is only inferable by reading existing
      algorithms.
- [ ] Decide the theming story (see High #2) before adding algorithms that want distinct
      per-algorithm overlay colors, since the palette plumbing is half-built.

## Issues found

### High — correctness / architecture problems in what's shipped today

1. ~~**`/` does not lead to `/grid`.**~~ Resolved by the Vite migration: there is no router
   any more and the visualizer renders at `/`.
2. **Dark/light theming is scaffolded but not implemented.** `features/painters/colors.ts`
   exports `lightPalette` and `darkPalette` — but `darkPalette` is a byte-for-byte copy of
   `lightPalette`, and both `basePainter.ts` and `overlayPainter.ts` hardcode
   `import { lightPalette as palette }`. There is no theme state, no toggle, and no code path
   that would ever select `darkPalette` even once it's filled in.
3. **Grid resize is unreachable in the running app.** `Toolbar/Settings.tsx` implements
   rows/cols/cell-size editing against `useSettingsStore`'s draft fields and
   `useGridStore.setDimensions`/`setCellSize`, but the component is never imported/rendered
   anywhere (`Toolbar/index.ts` only exports `Toolbar`, which only renders `AlgoControls`).
   The grid is permanently `ROWS=35, COLS=61, CELL_SIZE=20` (`utils/constants.ts`) for any
   real user.
4. ~~**`features/Canvas/` was dead, byte-level-duplicate code** of `components/CanvasStage` +
   `useCanvasLayer`.~~ Resolved: deleted.
5. **Dijkstra has no weighted cells to justify its own existence.** `CellKind` is only
   `empty | wall`; `dijkstra.ts` hardcodes edge weight `w = 1` for every step, making it
   behaviorally identical to BFS (just slower, due to heap overhead) for every grid the UI
   can currently produce. Either add a weighted-terrain `CellKind` (with paint UI + palette
   entry) or treat Dijkstra as a placeholder until one exists.

6. **Prim's maze sometimes comes out as a solid block of walls.** `prims.ts` picks the start
   as `random(0, rows-1)` and decrements it when even, so a roll of `0` gives `r = -1` (same
   for `c`). No frontier is in bounds from there, so nothing is carved after `fill-wall` —
   roughly 1 run in 20 on the default 35x61 grid. Fix: `randomOdd(1, rows - 2)` /
   `randomOdd(1, cols - 2)`. Pinned by `it.fails` in `tests/features/mazes/prims.test.ts` and
   the in-bounds contract in `tests/features/mazes/index.test.ts`.

### Medium — code quality, maintainability, extensibility

1. Per-algorithm boilerplate duplication (`id`/`inb`/`isWall`/`getCoord` re-derived in all
   four `features/algo/*.ts` files) and per-maze duplication (`id`/`inb` in `floodFill.ts` /
   `prims.ts`) — not shared via `features/algo/utils.ts` despite that file existing for
   exactly this purpose. Increases the cost of every new algorithm and risks the four copies
   drifting (e.g. bounds-check logic diverging).
2. ~~No automated tests.~~ Resolved: Vitest + Testing Library suite in `tests/` with coverage
   thresholds (`npm run test:coverage`).
3. `algorithms`/`algoLabels` and `mazes`/`mazesLabels` are two parallel data structures that
   must be hand-kept in sync (`features/algo/index.ts`, `features/mazes/index.ts`) — easy to
   add a key to one and forget the other, silently hiding or breaking an option.
4. No persistence layer — grid contents, selected algorithm, and speed are lost on refresh.
   Not necessarily wrong for a visualizer, but worth an explicit decision (e.g. `localStorage`
   for the grid) rather than the current default-by-omission.
5. ~~Boilerplate README/metadata.~~ Resolved: README is project-specific and the title/description
   now live in `index.html`.
6. ~~CSS font variable typo (`--font-montrerrat`) + missing comma in `body`'s `font-family`.~~
   Resolved in the Vite migration: `src/index.css` now names the Fontsource families directly.
7. Inconsistent naming across the codebase: `snake_case` (`min_priority_queue`,
   `create_neighbors`, `randomOdd`/`randomEven`'s internal `min`/`max` juggling) mixed with
   the otherwise-consistent `camelCase` convention. Two same-named-but-different `store`
   concepts (`src/store/` = data structures, `src/features/store/` = Zustand) risk confusing
   contributors and IDE auto-imports.
8. Toolbar's Step vs Pause is a conditional _render swap_ (`status === 'running' ? Pause :
Step`) while Visualize/Clear-path use `disabled` instead — two different UX patterns for
   "unavailable action" in the same control cluster (`AlgoControls.tsx`).
9. `useAlgoController`'s `runners` cache is unbounded and never evicts old algorithm-key
   entries — for this app's fixed 4-algorithm registry it's harmless, but the pattern doesn't
   scale if the registry grows much larger and the user flips through many algorithms in one
   session (each keeps a full generator + closures alive).

10. Randomized DFS maze (`floodFill.ts`) can start one cell past the grid edge: the start is
    `random(0, floor(rows/2)) * 2 + 1`, which can equal `rows` (or `cols`). The first carve is
    out of bounds and the walk then carves a hole through the outer border wall. Fix:
    `random(0, floor((rows - 2) / 2))`. Pinned by `it.fails` in `tests/features/mazes/floodFill.test.ts`.

### Low — minor bugs, typos, naming nits

1. Typo: `"Breath-first search"` should be `"Breadth-first search"`
   (`features/algo/index.ts`, shown verbatim in the algorithm dropdown UI).
2. Three similarly-named canvas concepts (`Canvas` (dead), `CanvasStage`, `CanvasGrid`) make
   it harder than necessary to guess which one to import; consider renaming once the dead one
   (High #4) is removed, e.g. `CanvasStage` → keep, `CanvasGrid` → `GridCanvas` or similar to
   read less like a synonym.
3. `src/ui/Grid.tsx`'s default export function is named `GridPage` although the module is
   `Grid` and there are no pages any more — confusing when scanning stack traces or dev-tools
   component names.
4. Empty `try { ... } catch { /* no-op */ }` blocks around `setPointerCapture`/
   `releasePointerCapture` in `CanvasGrid.tsx` are fine defensively, but silently swallow any
   _unexpected_ error too — consider at least a dev-mode `console.debug` if this ever needs
   debugging.
5. `basePainter.ts`'s cell/marker draw functions hardcode a `0.25` overdraw offset and
   `#000000` fill (goal marker's inner dot) inline as magic numbers/colors rather than
   sourcing from `GridPalette` — minor inconsistency given how deliberately the rest of the
   palette is centralized.
6. ~~`next.config.ts` is an empty stub.~~ Resolved: Next.js removed.
7. `shuffle` in `features/algo/utils.ts` draws `j` from `[0, i-1]` (Sattolo's algorithm)
   instead of `[0, i]` (Fisher–Yates), so it only produces cyclic permutations — no element
   ever stays in place. Mazes still work but are less random than intended.
   Pinned by `it.fails` in `tests/features/algo/utils.test.ts`.
8. `bidirectionalBfs` returns `[start, neighbour, start]` when `start === goal`. The grid store
   never lets the markers overlap, so it's unreachable from the UI today.
   Pinned by `it.fails` in `tests/features/algo/bidirectionalBfs.test.ts`.
9. `useAlgoController`'s `animatePath` option is inverted: it's documented as "default true
   (if false, path is drawn instantly)" but is passed straight through as `instant`. Nothing
   passes it today. Pinned by `it.fails` in `tests/features/animations/useAlgoController.test.ts`.
