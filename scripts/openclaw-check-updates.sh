#!/bin/bash
#
# openclaw-check-updates.sh - Check for upstream updates
#
# Usage: ./scripts/openclaw-check-updates.sh
#
# This can be run periodically (e.g., daily via cron) to check for updates.
# Add to crontab for automatic checks:
#   0 9 * * * /path/to/openclaw/scripts/openclaw-check-updates.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if there are updates
UPSTREAM_SHA=$(git rev-parse upstream/main 2>/dev/null || echo "")
LOCAL_SHA=$(git rev-parse main 2>/dev/null || echo "")

if [[ -z "$UPSTREAM_SHA" || -z "$LOCAL_SHA" ]]; then
    echo "ERROR: Could not determine upstream/local commits"
    exit 1
fi

if [[ "$UPSTREAM_SHA" == "$LOCAL_SHA" ]]; then
    echo "✓ OpenClaw is up to date"
    exit 0
fi

BEHIND=$(git rev-list --count "$LOCAL_SHA..upstream/main")

echo "============================================="
echo "OpenClaw Update Available"
echo "============================================="
echo ""
echo "Your version:  $LOCAL_SHA"
echo "Upstream:      $UPSTREAM_SHA"
echo "Commits behind: $BEHIND"
echo ""
echo "Recent upstream changes:"
git log --oneline -10 upstream/main
echo ""
echo "To merge updates, run:"
echo "  ./scripts/openclaw-sync.sh"
echo ""

# Exit with code 1 so you can use this in cron alerts
exit 1
