#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v pnpm >/dev/null 2>&1; then
  pnpm install
elif command -v npm >/dev/null 2>&1; then
  npm install
else
  echo "Error: install Node.js (>=20) first." >&2
  exit 1
fi
echo "Done."
