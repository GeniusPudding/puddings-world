#!/usr/bin/env bash
# Syncs the generated KTV wire contract from its canonical home in
# StreetPerformerMaster into this repo's lib/ktv/contract.gen.ts.
#
# The contract is OWNED by StreetPerformerMaster:
#   canonical:  contract/ktv-contract.json   (the only file a human edits)
#   generator:  python tools/gen_contract.py (renders contract/dist/*)
# This script only copies the rendered TS artifact — never edit either side
# by hand. To change the contract, edit the JSON there, regenerate, re-sync.
#
# Usage:
#   ./scripts/sync-ktv-contract.sh [path-to-StreetPerformerMaster]

set -euo pipefail

SOURCE="${1:-$HOME/Desktop/StreetPerformerMaster}"
SRC_FILE="$SOURCE/contract/dist/ktv-contract.ts"
DST_FILE="$(cd "$(dirname "$0")/.." && pwd)/lib/ktv/contract.gen.ts"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "Source artifact not found: $SRC_FILE — run 'python tools/gen_contract.py' in $SOURCE first." >&2
  exit 1
fi

if cmp -s "$SRC_FILE" "$DST_FILE" 2>/dev/null; then
  echo "Already up to date."
else
  cp "$SRC_FILE" "$DST_FILE"
  echo "Updated lib/ktv/contract.gen.ts"
fi

grep -o 'KTV_CONTRACT_VERSION = "[^"]*"' "$DST_FILE" | head -1
