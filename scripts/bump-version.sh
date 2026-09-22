#!/usr/bin/env bash
# Bump a SemVer VERSION file. Usage: bump-version.sh [patch|minor|major] [path]
# Default: patch, path defaults to ./VERSION. Prints the new version.
set -euo pipefail

PART="${1:-patch}"
FILE="${2:-VERSION}"

if [[ ! -f "$FILE" ]]; then
  echo "bump-version: $FILE not found" >&2
  exit 1
fi

CURRENT="$(tr -d '[:space:]' < "$FILE")"
if [[ ! "$CURRENT" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "bump-version: $FILE does not contain SemVer (got '$CURRENT')" >&2
  exit 1
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"

case "$PART" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  *) echo "bump-version: unknown part '$PART' (want patch|minor|major)" >&2; exit 1 ;;
esac

NEW="$MAJOR.$MINOR.$PATCH"
printf '%s\n' "$NEW" > "$FILE"
printf '%s\n' "$NEW"
