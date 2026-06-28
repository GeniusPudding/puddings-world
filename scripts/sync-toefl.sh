#!/usr/bin/env bash
# Syncs the TOEFL Daily Trainer PWA from the canonical source in
# us-online-masters-guide into this site's public/toefl/.
#
# Usage:
#   ./scripts/sync-toefl.sh
#   SOURCE=/path/to/toefl-trainer ./scripts/sync-toefl.sh

set -euo pipefail

SOURCE="${SOURCE:-$HOME/Desktop/GitHub/us-online-masters-guide/toefl-trainer}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DST="$SCRIPT_DIR/../public/toefl"

if [ ! -d "$SOURCE" ]; then
  echo "Source not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$DST"

for f in index.html manifest.json sw.js; do
  if [ ! -f "$SOURCE/$f" ]; then
    echo "Warning: missing source file $SOURCE/$f (skipped)" >&2
    continue
  fi
  cp -f "$SOURCE/$f" "$DST/$f"
  echo "  $f"
done

echo ""
echo "Synced TOEFL trainer to $DST"
echo "Commit + push to deploy via Vercel."
