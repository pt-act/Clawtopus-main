#!/bin/bash
#
# openclaw-sync.sh - Sync your fork with upstream OpenClaw
#
# Usage: ./scripts/openclaw-sync.sh [--dry-run]
#
# This script fetches changes from upstream and merges them into your fork.
# Your custom features (Session Brain, Atomic Facts, etc.) should be preserved.
#
# IMPORTANT: Push is disabled for upstream remote to prevent accidental pushes.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "[DRY RUN] No changes will be made"
fi

echo "============================================"
echo "OpenClaw Sync Script"
echo "============================================"
echo ""

# Check remotes
echo "[1/6] Checking remotes..."
if ! git remote get-url upstream &>/dev/null; then
    echo "ERROR: upstream remote not configured"
    echo "Run: git remote add upstream https://github.com/openclaw/openclaw.git"
    exit 1
fi

UPSTREAM_PUSH=$(git remote get-url --push upstream 2>/dev/null || echo "")
if [[ "$UPSTREAM_PUSH" == "DISABLED" ]]; then
    echo "  ✓ upstream is fetch-only (push disabled)"
elif [[ -z "$UPSTREAM_PUSH" ]]; then
    echo "WARNING: upstream push URL is not set to DISABLED"
    echo "Consider running: git remote set-url --push upstream DISABLED"
fi

# Check for uncommitted changes
echo ""
echo "[2/6] Checking for uncommitted changes..."
if [[ -n "$(git status --porcelain)" ]]; then
    echo "WARNING: You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit them before syncing? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Please commit your changes first, then run this script again."
        exit 1
    fi
fi

# Fetch upstream
echo ""
echo "[3/6] Fetching upstream changes..."
git fetch upstream --no-tags --quiet

UPSTREAM_SHA=$(git rev-parse upstream/main)
LOCAL_SHA=$(git rev-parse main)

echo "  Upstream:  $UPSTREAM_SHA"
echo "  Local:     $LOCAL_SHA"

if [[ "$UPSTREAM_SHA" == "$LOCAL_SHA" ]]; then
    echo ""
    echo "✓ Already up to date with upstream"
    exit 0
fi

# Show what changed
echo ""
echo "[4/6] Changes from upstream:"
git log --oneline "$LOCAL_SHA..upstream/main" | head -20
CHANGES_COUNT=$(git rev-list --count "$LOCAL_SHA..upstream/main")
echo "  ($CHANGES_COUNT commits behind)"

# Merge
echo ""
echo "[5/6] Merging upstream into local..."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY RUN] Would execute: git merge upstream/main"
else
    # Try merge first, if conflicts, show them
    if git merge upstream/main --no-edit; then
        echo "✓ Merge successful"
    else
        echo ""
        echo "WARNING: Merge conflicts detected!"
        echo ""
        echo "Conflicts in:"
        git diff --name-only --diff-filter=U
        echo ""
        echo "To resolve:"
        echo "  1. Edit conflicting files"
        echo "  2. git add <resolved-files>"
        echo "  3. git commit"
        echo ""
        echo "Your custom features should be in these files (preserve them):"
        echo "  - src/agents/session-brain/*"
        echo "  - src/agents/atomic-facts*.ts"
        echo "  - src/agents/skill-factory/*"
        echo "  - src/agents/curriculum/*"
        echo "  - src/cli/memory-cli.ts"
        echo "  - src/config/*session-brain*"
        exit 1
    fi
fi

# Show result
echo ""
echo "[6/6] Sync complete!"
echo ""
echo "New HEAD:"
git log -1 --oneline
echo ""

echo "============================================"
echo "Next steps:"
echo "============================================"
echo "1. Run tests:   pnpm test:fast"
echo "2. Run build:   pnpm build"
echo "3. If tests pass, you're good to go!"
echo ""
echo "To push to your origin:"
echo "  git push origin main"
echo ""
