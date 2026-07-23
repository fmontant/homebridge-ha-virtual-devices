#!/usr/bin/env bash

# Shared helpers for project maintenance scripts.
# This file is meant to be sourced, not executed directly.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  printf '✗ Ce fichier doit être chargé avec source.\n' >&2
  exit 1
fi

COMMON_SH_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

COMMON_PROJECT_ROOT="$(
  cd "${COMMON_SH_DIR}/../.." >/dev/null 2>&1
  pwd
)"

line() {
  printf '%s\n' '────────────────────────────────────────'
}

banner() {
  local title="${1:-}"

  line
  printf '%s\n' "$title"
  line
}

step() {
  printf '\n▶ %s\n' "$1"
}

success() {
  printf '✓ %s\n' "$1"
}

warning() {
  printf '⚠ %s\n' "$1" >&2
}

fail() {
  printf '✗ %s\n' "$1" >&2
  exit 1
}

require_command() {
  local command_name="${1:-}"
  local display_name="${2:-$command_name}"

  [[ -n "$command_name" ]] \
    || fail "Nom de commande manquant."

  command -v "$command_name" >/dev/null 2>&1 \
    || fail "${display_name} est introuvable."
}

require_commands() {
  local command_name

  for command_name in "$@"; do
    require_command "$command_name"
  done
}

project_root() {
  printf '%s\n' "$COMMON_PROJECT_ROOT"
}

enter_project_root() {
  cd "$COMMON_PROJECT_ROOT" \
    || fail "Impossible d'accéder au projet : ${COMMON_PROJECT_ROOT}"
}

git_current_branch() {
  git branch --show-current
}

git_require_repository() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || fail "Le répertoire courant n'est pas un dépôt Git."
}

git_require_head() {
  git rev-parse --verify HEAD >/dev/null 2>&1 \
    || fail "Le dépôt Git ne contient aucun commit."
}

git_require_clean() {
  [[ -z "$(git status --porcelain)" ]] \
    || fail "Le dépôt contient des modifications non validées."
}

git_require_branch() {
  local expected_branch="${1:-}"
  local current_branch

  [[ -n "$expected_branch" ]] \
    || fail "Branche Git attendue non définie."

  current_branch="$(git_current_branch)"

  [[ "$current_branch" == "$expected_branch" ]] \
    || fail "Branche courante : ${current_branch}. Branche attendue : ${expected_branch}."
}

git_fetch_branch() {
  local remote_name="${1:-origin}"
  local branch_name="${2:-main}"
  local include_tags="${3:-false}"

  if [[ "$include_tags" == "true" ]]; then
    git fetch "$remote_name" "$branch_name" --tags --quiet
  else
    git fetch "$remote_name" "$branch_name" --quiet
  fi
}

git_require_synced() {
  local remote_name="${1:-origin}"
  local branch_name="${2:-main}"
  local local_commit
  local remote_commit

  local_commit="$(git rev-parse HEAD)"
  remote_commit="$(git rev-parse "${remote_name}/${branch_name}")"

  [[ "$local_commit" == "$remote_commit" ]] \
    || fail "La branche locale n'est pas synchronisée avec ${remote_name}/${branch_name}."
}

package_name() {
  node -p "require('./package.json').name"
}

package_version() {
  node -p "require('./package.json').version"
}

validate_semver() {
  local version="${1:-}"

  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]
}

require_semver() {
  local version="${1:-}"
  local context="${2:-Version invalide}"

  validate_semver "$version" \
    || fail "${context} : ${version}"
}

next_patch_version() {
  node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0], version[1], version[2] + 1].join('.'));
" "$1"
}

next_minor_version() {
  node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0], version[1] + 1, 0].join('.'));
" "$1"
}

next_major_version() {
  node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0] + 1, 0, 0].join('.'));
" "$1"
}

confirm_exact() {
  local prompt="${1:-Confirmer ?}"
  local expected_answer="${2:-oui}"
  local answer

  printf '\n%s ' "$prompt"
  read -r answer

  [[ "$answer" == "$expected_answer" ]]
}

require_confirmation() {
  local prompt="${1:-Confirmer ?}"
  local cancellation_message="${2:-Opération annulée.}"
  local expected_answer="${3:-oui}"

  confirm_exact "$prompt" "$expected_answer" \
    || fail "$cancellation_message"
}

npm_current_user() {
  local registry="${1:-https://registry.npmjs.org}"
  local npm_user

  if ! npm_user="$(npm whoami --registry "$registry" 2>/dev/null)"; then
    printf '\nVous n'\''êtes pas connecté à npm.\n\n' >&2
    printf 'Exécutez :\n\n' >&2
    printf 'npm login --auth-type=web\n\n' >&2
    printf 'Puis relancez :\n\n' >&2
    printf 'npm run release\n\n' >&2
    return 1
  fi

  printf '%s\n' "$npm_user"
}

npm_require_login() {
  local registry="${1:-https://registry.npmjs.org}"
  local npm_user

  npm_user="$(npm_current_user "$registry")" \
    || exit 1

  printf '%s\n' "$npm_user"
}

npm_version_exists() {
  local package_spec="${1:-}"
  local registry="${2:-https://registry.npmjs.org}"

  npm view "$package_spec" version \
    --registry "$registry" >/dev/null 2>&1
}

git_tag_exists_local() {
  local tag_name="${1:-}"

  git rev-parse "$tag_name" >/dev/null 2>&1
}

git_tag_exists_remote() {
  local remote_name="${1:-origin}"
  local tag_name="${2:-}"

  git ls-remote \
    --exit-code \
    --tags \
    "$remote_name" \
    "refs/tags/${tag_name}" >/dev/null 2>&1
}

run_quality_checks() {
  npm run lint
  npm run build:all
}

ensure_no_generated_changes() {
  [[ -z "$(git status --porcelain)" ]] \
    || fail "Le build a généré des modifications. Vérifiez-les et validez-les avant de continuer."
}

trap_with_context() {
  local context="${1:-Opération}"
  trap 'fail "'"${context}"' interrompue à la ligne ${LINENO}."' ERR
}
