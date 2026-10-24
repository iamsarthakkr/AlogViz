# Deployment

How AlgoViz runs in production and how changes get there. For what the app does and how to run it
locally, see [README.md](README.md).

## Overview

```text
Browser ──► https://<domain> ──► Caddy (shared, on the VPS host) ──► 127.0.0.1:${HOST_PORT}  algo-viz container
                                                                     (nginx serving the static build)
```

- AlgoViz is a fully static single-page app: there is no backend, API or database. The container is just nginx
  serving the Vite build from `dist/`.
- The VPS hosts several apps behind one global **Caddyfile**. This repo deploys a single container, defined in
  [`compose.yaml`](compose.yaml), published on `127.0.0.1` only — so it's reachable through Caddy and nowhere else.
  (Publishing on `0.0.0.0` would expose it publicly, because Docker's iptables rules bypass ufw.)
- `HOST_PORT` defaults to `3002` so it doesn't collide with the portfolio on the same VPS.

## Container

Built by the multi-stage [`Dockerfile`](Dockerfile): `npm ci` + `npm run build` on `node:22-alpine`, then the
`dist/` output is copied into `nginxinc/nginx-unprivileged` (runs as a non-root user, listens on `8080`).

[`nginx.conf`](nginx.conf):

- caches hashed `/assets/*` for a year and serves `index.html` with `no-cache`, so new deploys are picked up
  immediately;
- falls back to `index.html` for unknown paths, so a client-side router can be added later without nginx changes;
- sets a same-origin **Content-Security-Policy** (scripts, styles and fonts are all self-hosted) plus
  `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy`, and hides the nginx version. If you ever add an
  external origin (CDN, analytics, web fonts), the CSP has to allow it;
- exposes `/healthz`, used by the compose healthcheck and the smoke test.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every pull request and push to `main`:

1. **Lint, test and build** — `npm run lint`, `npm run test:coverage` (fails below the thresholds in
   `vite.config.ts`), `npm run build` (type-checks `src` and `tests`, then bundles).
2. **Docker image** — builds the image and runs [`scripts/smoke-test.sh`](scripts/smoke-test.sh) against it:
   health check, app shell, SPA fallback, the hashed JS bundle being served with long-term caching, `no-cache` on
   `index.html`, all security headers present and the nginx version hidden.

The smoke test runs locally against any image:

```bash
docker build -t algo-viz:local . && scripts/smoke-test.sh algo-viz:local
SMOKE_PORT=18080 scripts/smoke-test.sh algo-viz:local   # if 8080 is taken
```

## Releasing a version

[`.github/workflows/release.yml`](.github/workflows/release.yml) runs when a version tag is pushed. It re-runs CI
on that commit, then pushes `ghcr.io/iamsarthakkr/algo-viz:<version>` (and `:latest`) and creates a GitHub release.
The tag and `package.json` must agree, otherwise the release fails.

```bash
npm version patch --no-git-tag-version   # bump package.json
git commit -am "Release 1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

## Deploying

On the VPS, from a checkout of `main`:

```bash
cp .env.example .env         # first time only: set HOST_PORT
git pull
docker compose up -d --build
```

`compose.yaml` builds the image from the checkout; the GHCR images from releases aren't used by it yet. The
compose healthcheck polls `/healthz` every 30 seconds — `docker compose ps` shows the container as `healthy` once
it's serving.

Caddy proxies the domain to the container:

```caddyfile
algoviz.example.com {
    reverse_proxy 127.0.0.1:3002
}
```

### Rolling back

Check out the previous release tag and rebuild:

```bash
git checkout v1.0.0
docker compose up -d --build
```
