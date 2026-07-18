#!/usr/bin/env bash
# Assemble the exact public artifact consumed by the VPS deployment workflow.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DESTINATION="${1:-}"

die() {
  echo "[ERROR] $*" >&2
  exit 1
}

[[ -n "$DESTINATION" ]] || die "Usage: bash deploy/assemble-static-site.sh <empty-output-directory>"
[[ "$DESTINATION" != "/" ]] || die "Refusing to use / as the output directory"
[[ ! -e "$DESTINATION" ]] || die "Output path already exists: $DESTINATION"

for source in index.html css js assets; do
  [[ -e "$PROJECT_DIR/$source" ]] || die "Missing public source: $source"
done

mkdir -p "$DESTINATION"
cp -R \
  "$PROJECT_DIR/index.html" \
  "$PROJECT_DIR/css" \
  "$PROJECT_DIR/js" \
  "$PROJECT_DIR/assets" \
  "$DESTINATION/"

[[ -s "$DESTINATION/index.html" ]] || die "Assembled artifact has no index.html"

echo "Assembled Tiny Cosmos static site at $DESTINATION"
