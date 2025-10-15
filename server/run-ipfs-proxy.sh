#!/usr/bin/env bash
set -euo pipefail
# always run from server folder
cd "$(dirname "$0")"
# use *local* tsx, not any global one
exec ./node_modules/.bin/tsx src/ipfsProxyStandalone.ts
