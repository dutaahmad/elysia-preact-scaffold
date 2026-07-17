#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR="packages/prelysia"
PACKAGE_JSON="$PACKAGE_DIR/package.json"
PACKAGE_NAME="prelysia-cli"

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()      { echo -e "${BOLD}${1}${NC}"; }
log_step() { echo -e "\n${BLUE}[$1/$2]${NC} ${BOLD}$3${NC}"; }
ok()       { echo -e "  ${GREEN}✔${NC} $1"; }
warn()     { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()     { echo -e "  ${RED}✘${NC} $1"; exit 1; }
confirm()  { echo -en "  ${YELLOW}?${NC} $1 [y/N] "; read -r ans; [[ "$ans" =~ ^[Yy]$ ]]; }

cleanup() {
  echo
  fail "Script aborted at step $CURRENT_STEP."
}
trap cleanup ERR

get_version() {
  bun -e "
    import { readFileSync } from 'fs';
    const pkg = JSON.parse(readFileSync('$PACKAGE_JSON', 'utf-8'));
    console.log(pkg.version);
  "
}

set_version() {
  local ver="$1"
  bun -e "
    import { readFileSync, writeFileSync } from 'fs';
    const pkg = JSON.parse(readFileSync('$PACKAGE_JSON', 'utf-8'));
    pkg.version = '$ver';
    writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
  "
}

CURRENT_STEP=0

# ──────────────────────────────────────────────
check_prereqs() {
  CURRENT_STEP=1
  log_step 1 5 "Prerequisites"

  command -v bun >/dev/null 2>&1 || fail "bun is required but not installed"
  ok "bun found"

  local dirty
  dirty=$(git status --porcelain 2>&1) || fail "Not a git repository"
  if [[ -n "$dirty" ]]; then
    fail "Working tree has uncommitted changes — commit or stash first"
  fi
  ok "Git working tree clean"

  local current
  current=$(get_version)
  log "  Current version: ${BOLD}${current}${NC}"
}

# ──────────────────────────────────────────────
bump_version() {
  CURRENT_STEP=2
  log_step 2 5 "Bump version"

  local current
  current=$(get_version)

  local new_ver
  read -p "  Enter new version [${current}]: " new_ver

  if [[ -z "$new_ver" ]]; then
    new_ver="$current"
  fi

  if [[ ! "$new_ver" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    fail "Invalid version format — expected semver (e.g. 0.2.0)"
  fi

  set_version "$new_ver"

  local bumped
  bumped=$(get_version)
  if [[ "$bumped" != "$new_ver" ]]; then
    fail "Version mismatch after write (got $bumped, expected $new_ver)"
  fi
  ok "Version bumped to ${bumped}"
}

# ──────────────────────────────────────────────
sync_and_verify() {
  CURRENT_STEP=3
  log_step 3 5 "Sync and verify"

  local expected
  expected=$(get_version)
  log "  Target version: ${BOLD}${expected}${NC}"

  echo "  Running bun install..."
  bun install > /dev/null 2>&1 || fail "bun install failed"
  ok "bun install"

  local cli_ver
  cli_ver=$(bun run prelysia --version 2>&1) || fail "prelysia --version failed"
  if [[ "$cli_ver" != "$expected" ]]; then
    fail "CLI version mismatch — CLI reports ${cli_ver}, package.json has ${expected}"
  fi
  ok "prelysia --version → ${cli_ver}"

  echo "  Running bun publish --dry-run..."
  local tarball
  tarball=$(cd "$PACKAGE_DIR" && bun publish --dry-run 2>&1) || fail "bun publish --dry-run failed"
  echo "$tarball" | head -20

  # Check for leaked directories
  if echo "$tarball" | grep -qE '^(server/|src/)'; then
    fail "Tarball contains server/ or src/ — update \"files\" in $PACKAGE_JSON"
  fi
  ok "Tarball contents clean (no server/, no src/)"
}

# ──────────────────────────────────────────────
commit_and_tag() {
  CURRENT_STEP=4
  log_step 4 5 "Commit and tag"

  local ver
  ver=$(get_version)

  git add -A > /dev/null 2>&1
  local stats
  stats=$(git diff --cached --stat)
  log "  Changes staged:"
  echo "$stats"

  if ! confirm "Commit as \"chore: bump ${PACKAGE_NAME} to v${ver}\"?"; then
    fail "Commit cancelled by user"
  fi

  git commit -m "chore: bump ${PACKAGE_NAME} to v${ver}" > /dev/null
  ok "Committed"

  local tag="prelysia-cli-v${ver}"
  if git tag | grep -q "^${tag}$"; then
    warn "Tag ${tag} already exists — skipping tag creation"
  else
    git tag "$tag"
    ok "Tagged ${tag}"
  fi
}

# ──────────────────────────────────────────────
push_and_verify() {
  CURRENT_STEP=5
  log_step 5 5 "Push and verify"

  if ! confirm "Push to origin main?"; then
    echo "  Push skipped. Run manually:"
    echo "    git push origin main --tags"
    return
  fi

  git push origin main --tags
  ok "Pushed to origin main"

  echo "  Waiting 30 seconds for npm registry propagation..."
  sleep 30

  local registry_ver
  registry_ver=$(npm view "$PACKAGE_NAME" version 2>&1) || warn "npm view failed — registry may be slow"
  if [[ -n "$registry_ver" ]]; then
    ok "npm registry shows version ${registry_ver}"
  fi

  if confirm "Install globally and smoke-test?"; then
    bun install -g "$PACKAGE_NAME" > /dev/null 2>&1 && {
      ok "Global install succeeded"
      local help_out
      help_out=$(prelysia --help 2>&1) || true
      echo "$help_out" | head -5
      ok "prelysia --help works"
    } || {
      warn "Global install failed — run manually: bun install -g ${PACKAGE_NAME}"
    }
  fi
}

# ──────────────────────────────────────────────
main() {
  echo
  log "${BOLD}${PACKAGE_NAME} — Publish Script${NC}"
  echo "  Repo:  https://github.com/dutaahmad/elysia-preact-scaffold"
  echo "  Pkg:   packages/prelysia → npm as ${PACKAGE_NAME}"
  echo
  echo "  This script automates the release process from CONTRIBUTE.md."
  echo "  Press Ctrl+C at any time to abort."

  if ! confirm "Continue?"; then
    echo "Aborted."
    exit 0
  fi

  check_prereqs
  bump_version
  sync_and_verify
  commit_and_tag
  push_and_verify

  echo
  log "${GREEN}${BOLD}Done.${NC}"
  echo "  If the publish succeeded, verify at:"
  echo "    https://www.npmjs.com/package/${PACKAGE_NAME}"
  echo "  If the registry is slow to update:"
  echo "    curl -s https://registry.npmjs.org/${PACKAGE_NAME} | jq '.dist-tags'"
}

main "$@"
