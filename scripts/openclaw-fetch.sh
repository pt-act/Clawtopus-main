#!/bin/bash
#
# openclaw-fetch.sh - Fetch latest from upstream without merging
#
# Usage: ./scripts/openclaw-fetch.sh
#
# This just fetches upstream changes so you can review them before merging.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Fetching upstream changes..."
git fetch upstream --no-tags

UPSTREAM_SHA=$(git rev-parse upstream/main)
LOCAL_SHA=$(git rev-parse main)

echo ""
echo "Upstream:  $UPSTREAM_SHA"
echo "Local:     $LOCAL_SHA"

if [[ "$UPSTREAM_SHA" == "$LOCAL_SHA" ]]; then
    echo "✓ Already up to date"
else
    BEHIND=$(git rev-list --count "$LOCAL_SHA..upstream/main")
    echo "✓ $BEHIND commits behind upstream"
    echo ""
    echo "To see what's new:"
    echo "  git log --oneline main..upstream/main"
    echo ""
    echo "To merge:"
    echo "  ./scripts/openclaw-sync.sh"
fi
