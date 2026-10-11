#!/usr/bin/env bash
set -euo pipefail
# Run from a checkout; piping to bash loses the repository directory.
SOURCE="$0"
if [[ "$SOURCE" == "bash" || "$SOURCE" == "-bash" || "$SOURCE" == /dev/fd/* ]]; then
  echo "ERROR: Clone the repository and run bash install.sh; curl | bash is unsupported." >&2
  exit 2
fi
ROOT="$(cd "$(dirname "$SOURCE")" && pwd -P)"
if [[ ! -f "$ROOT/SKILL.md" || ! -f "$ROOT/.skills.json" ]]; then
  echo "ERROR: Missing SKILL.md or .skills.json in the source directory." >&2
  exit 2
fi
install_copy() {
  local parent="$1"
  local dest="$parent/skytheme-storefront"
  if [[ -e "$dest" || -L "$dest" ]]; then
    echo "SKIP existing installation: $dest (nothing deleted)"
    return
  fi
  mkdir -p "$parent"
  local staging
  staging="$(mktemp -d "$parent/.skytheme-install.XXXXXX")"
  if ! cp -R "$ROOT/." "$staging/"; then
    rm -rf "$staging"
    return 1
  fi
  if ! mv "$staging" "$dest"; then
    rm -rf "$staging"
    return 1
  fi
  echo "INSTALLED $dest"
}
if [[ -d "$HOME/.claude" ]]; then install_copy "$HOME/.claude/skills"; fi
if [[ -d "$HOME/.codex" ]]; then install_copy "$HOME/.codex/skills"; fi
if [[ -d "$HOME/.gemini" ]]; then install_copy "$HOME/.gemini/skills"; fi
if [[ -d ".cursor" ]]; then install_copy "$(pwd)/.cursor/skills"; fi
install_copy "$HOME/.agents/skills"
echo "Done. Review SKILL.md and invoke the skill from your coding agent."
