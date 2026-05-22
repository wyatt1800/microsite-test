#!/usr/bin/env bash
# Compare this site's pinned fe-llm-starter SHA against the latest HEAD on GitHub.
# Prints a one-line warning if they differ; silent otherwise. Always exits 0 so a
# failure (no gh, no network, no auth, no file) never blocks a session.
set -uo pipefail

REPO="1-800Accountant/fe-llm-starter"
BRANCH="master"
PINNED_FILE=".starter-version"

[ -f "$PINNED_FILE" ] || exit 0
PINNED=$(tr -d '[:space:]' < "$PINNED_FILE")
[ -z "$PINNED" ] && exit 0

command -v gh >/dev/null 2>&1 || exit 0

LATEST=$(gh api "repos/$REPO/commits/$BRANCH" --jq .sha 2>/dev/null) || exit 0
[ -z "$LATEST" ] && exit 0
[ "$PINNED" = "$LATEST" ] && exit 0

COUNT=$(gh api "repos/$REPO/compare/$PINNED...$LATEST" --jq '.commits | length' 2>/dev/null || echo "?")
echo "⚠ fe-llm-starter has $COUNT new commit(s) since this site was bootstrapped (${PINNED:0:7} → ${LATEST:0:7}). Run /refresh-starter to pull the latest guidance into CLAUDE.md."
