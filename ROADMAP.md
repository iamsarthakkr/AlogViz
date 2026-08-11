# Roadmap

Goal: reach a state where adding a new pathfinding algorithm or maze pattern is *only*
"write one generator file + register it in an index.ts map" — no touching hooks, painters,
or types. Then a categorized list of current bugs/issues found while reading the codebase
end to end.

## Path to "just add an algo.ts/generator.ts file"

- [ ] Delete `features/Canvas/` (`Canvas.tsx`, `useCanvas.ts`, `types.ts`, `index.ts`) — dead
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
      weighted `CellKind` (see High #3 below) — otherwise Dijkstra-family and future A*/cost
      algorithms have nothing to differentiate them from BFS in this codebase.
- [ ] Define a single `AlgoDefinition`/`MazeDefinition` shape (`{label, run, ...}`) so a new
      algorithm is *one* export added to *one* array, instead of updating both a `Record` and
      a parallel `string[]` labels array that must stay in sync by convention
      (`features/algo/index.ts`, `features/mazes/index.ts`).
- [ ] Add a lightweight test harness (none exists today — no `*.test.ts`, no test runner in
      `package.json`) so a new generator can be verified (finds shortest path on a known
      grid, terminates, doesn't yield out-of-bounds coords) without manual UI testing.
- [ ] Document (in code or ARCHITECTURE.md) the exact generator contract new authors must
      follow: yield order guarantees, that `path` must be the *last* yield, that coordinates
      must be in-bounds, etc. — currently this is only inferable by reading existing
      algorithms.
- [ ] Decide the theming story (see High #2) before adding algorithms that want distinct
      per-algorithm overlay colors, since the palette plumbing is half-built.

## Issues found

### High — correctness / architecture problems in what's shipped today

1. **`/` does not lead to `/grid`.** The root route is the untouched `create-next-app`
   placeholder (`<div>Hello world</div>`). A user landing on the site has no path to the
   actual app except knowing the `/grid` URL. `app/page.tsx`.
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
4. **`features/Canvas/` is dead, unused, byte-level-duplicate code** of
   `components/CanvasStage` + `useCanvasLayer` (confirmed: zero imports anywhere in `src/`).
   Two parallel implementations of the same stacked-canvas concept is a correctness risk the
   moment someone fixes a bug in one and not the other, believing it's "the" implementation.
5. **Dijkstra has no weighted cells to justify its own existence.** `CellKind` is only
   `empty | wall`; `dijkstra.ts` hardcodes edge weight `w = 1` for every step, making it
   behaviorally identical to BFS (just slower, due to heap overhead) for every grid the UI
   can currently produce. Either add a weighted-terrain `CellKind` (with paint UI + palette
   entry) or treat Dijkstra as a placeholder until one exists.

### Medium — code quality, maintainability, extensibility

1. Per-algorithm boilerplate duplication (`id`/`inb`/`isWall`/`getCoord` re-derived in all
   four `features/algo/*.ts` files) and per-maze duplication (`id`/`inb` in `floodFill.ts` /
   `prims.ts`) — not shared via `features/algo/utils.ts` despite that file existing for
   exactly this purpose. Increases the cost of every new algorithm and risks the four copies
   drifting (e.g. bounds-check logic diverging).
2. No automated tests anywhere in the repo (`package.json` has no test script/dependency).
   Algorithms and maze generators are pure functions of `(grid)`/`(rows,cols)` and would be
   straightforward to unit test (shortest-path correctness on fixed grids, termination,
   in-bounds yields) without touching the DOM/canvas at all.
3. `algorithms`/`algoLabels` and `mazes`/`mazesLabels` are two parallel data structures that
   must be hand-kept in sync (`features/algo/index.ts`, `features/mazes/index.ts`) — easy to
   add a key to one and forget the other, silently hiding or breaking an option.
4. No persistence layer — grid contents, selected algorithm, and speed are lost on refresh.
   Not necessarily wrong for a visualizer, but worth an explicit decision (e.g. `localStorage`
   for the grid) rather than the current default-by-omission.
5. `README.md` and `app/layout.tsx`'s `metadata` (`title: 'Next template'`,
   description "next template generated by create-next-app") are unmodified boilerplate from
   the starter template — stale/misleading for anyone opening the repo cold.
6. CSS variable mismatch in `app/globals.css`: `--font-sans: var(--font-montrerrat)`
   (misspelled, extra "r") never matches the actually-defined `--font-montserrat` variable
   set by the `Montserrat` font loader in `app/layout.tsx` — the intended sans font silently
   never applies; the app falls back to the trailing generic `sans-serif` in `body`'s
   `font-family` (`var(--font-sans) sans-serif`).
7. Inconsistent naming across the codebase: `snake_case` (`min_priority_queue`,
   `create_neighbors`, `randomOdd`/`randomEven`'s internal `min`/`max` juggling) mixed with
   the otherwise-consistent `camelCase` convention. Two same-named-but-different `store`
   concepts (`src/store/` = data structures, `src/features/store/` = Zustand) risk confusing
   contributors and IDE auto-imports.
8. Toolbar's Step vs Pause is a conditional *render swap* (`status === 'running' ? Pause :
   Step`) while Visualize/Clear-path use `disabled` instead — two different UX patterns for
   "unavailable action" in the same control cluster (`AlgoControls.tsx`).
9. `useAlgoController`'s `runners` cache is unbounded and never evicts old algorithm-key
   entries — for this app's fixed 4-algorithm registry it's harmless, but the pattern doesn't
   scale if the registry grows much larger and the user flips through many algorithms in one
   session (each keeps a full generator + closures alive).

### Low — minor bugs, typos, naming nits

1. Typo: `"Breath-first search"` should be `"Breadth-first search"`
   (`features/algo/index.ts`, shown verbatim in the algorithm dropdown UI).
2. Three similarly-named canvas concepts (`Canvas` (dead), `CanvasStage`, `CanvasGrid`) make
   it harder than necessary to guess which one to import; consider renaming once the dead one
   (High #4) is removed, e.g. `CanvasStage` → keep, `CanvasGrid` → `GridCanvas` or similar to
   read less like a synonym.
3. `src/ui/Grid.tsx`'s default export function is named `GridPage` — same name as the actual
   route component in `app/grid/page.tsx`. Harmless (different modules) but confusing when
   scanning stack traces or dev-tools component names.
4. Empty `try { ... } catch { /* no-op */ }` blocks around `setPointerCapture`/
   `releasePointerCapture` in `CanvasGrid.tsx` are fine defensively, but silently swallow any
   *unexpected* error too — consider at least a dev-mode `console.debug` if this ever needs
   debugging.
5. `basePainter.ts`'s cell/marker draw functions hardcode a `0.25` overdraw offset and
   `#000000` fill (goal marker's inner dot) inline as magic numbers/colors rather than
   sourcing from `GridPalette` — minor inconsistency given how deliberately the rest of the
   palette is centralized.
6. `next.config.ts` is an empty stub (fine today, just noting there's no image/optimizations
   config should the app ever need one).
