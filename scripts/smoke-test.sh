#!/usr/bin/env bash
# Runs the built image and checks it serves the app correctly.
# Used by CI; also runnable locally: docker build -t algo-viz:local . && scripts/smoke-test.sh algo-viz:local
set -euo pipefail

IMAGE="${1:?usage: smoke-test.sh <image>}"
NAME="algo-viz-smoke"
PORT="${SMOKE_PORT:-8080}"
BASE="http://localhost:${PORT}"

fail() {
    echo "::error::$1"
    docker logs "$NAME" || true
    exit 1
}

docker rm -f "$NAME" > /dev/null 2>&1 || true
docker run -d --name "$NAME" -p "${PORT}:8080" "$IMAGE" > /dev/null
trap 'docker rm -f "$NAME" > /dev/null 2>&1 || true' EXIT

for _ in $(seq 1 15); do
    curl -fsS "$BASE/healthz" > /dev/null 2>&1 && break
    sleep 1
done

check_status() {
    local status
    status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$1")
    [ "$status" = "$2" ] || fail "GET $1 returned $status, expected $2"
    echo "GET $1 -> $status"
}

check_status /healthz 200
check_status / 200
check_status /does-not-exist 200 # SPA fallback to index.html

index=$(curl -fsS "$BASE/")
grep -q '<div id="root">' <<< "$index" || fail "index.html is not the app shell"

# The hashed JS bundle referenced by index.html must exist and be cached long-term
asset=$(grep -o '/assets/[^"]*\.js' <<< "$index" | head -1)
[ -n "$asset" ] || fail "no /assets/*.js referenced from index.html"
check_status "$asset" 200
curl -sI "$BASE$asset" | grep -qi '^cache-control:.*max-age=31536000' || fail "$asset is not cached long-term"
curl -sI "$BASE/" | grep -qi '^cache-control: no-cache' || fail "index.html must be revalidated on every load"

headers=$(curl -sI "$BASE/")
for header in content-security-policy x-content-type-options x-frame-options referrer-policy; do
    grep -qi "^$header:" <<< "$headers" || fail "missing $header header"
done
grep -qi '^server: nginx/' <<< "$headers" && fail "nginx version is exposed"

echo "Smoke test passed"
