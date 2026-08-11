# AlgoViz

A pathfinding-algorithm visualizer. Paint walls on a grid, place start/goal markers, then
watch a pathfinding algorithm (or generate a maze) animate step by step on canvas.

- **Algorithms**: Breadth-first search, Depth-first search, Bidirectional BFS, Dijkstra's
- **Maze / pattern generators**: Recursive Division (+ vertical/horizontal skew), Prim's,
  Randomized Depth-First Search, Random Walls
- **Controls**: Visualize, Pause/Step, Clear path, speed presets (slow/medium/fast)

See [CLAUDE.md](./CLAUDE.md) for project context and conventions,
[ARCHITECTURE.md](./ARCHITECTURE.md) for how state, rendering, and the algorithm/maze
generator pipeline work, [FEATURES.md](./FEATURES.md) for a feature-by-feature breakdown, and
[ROADMAP.md](./ROADMAP.md) for planned work and known issues.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Zustand 5 · Tailwind CSS 4 + daisyUI

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/grid](http://localhost:3000/grid) — the visualizer lives at
`/grid` (the root route `/` is currently a placeholder, see ROADMAP.md).

## Scripts

```bash
npm run dev      # start the Turbopack dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```
