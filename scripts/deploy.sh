#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${DOCKER:-}" = "1" ]; then
  docker build -t "puddings-world" .
  echo "Image built: puddings-world"
  echo "Push: docker tag puddings-world <registry>/puddings-world && docker push <registry>/puddings-world"
else
  if ! command -v vercel >/dev/null 2>&1; then npm i -g vercel; fi
  vercel deploy --prod
fi
