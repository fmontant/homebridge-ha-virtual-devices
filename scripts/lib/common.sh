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

detect_homebridge_container() {
  local docker_bin="${1:-docker}"
  local configured_name="${HOMEBRIDGE_CONTAINER:-}"
  local detected_name=""

  if [[ -n "$configured_name" ]]; then
    "$docker_bin" inspect "$configured_name" >/dev/null 2>&1 \
      || fail "Conteneur Homebridge introuvable : ${configured_name}"

    printf '%s\n' "$configured_name"
    return 0
  fi

  detected_name="$(
    "$docker_bin" ps \
      --format '{{.Names}}' |
      grep -i '^homebridge' |
      head -n 1
  )"

  [[ -n "$detected_name" ]] \
    || fail "Aucun conteneur Homebridge actif trouvé."

  printf '%s\n' "$detected_name"
}

get_project_root() {
  printf '%s\n' "$COMMON_PROJECT_ROOT"
}

enter_project_root() {
  cd "$COMMON_PROJECT_ROOT" \
    || fail "Impossible d'accéder au projet : ${COMMON_PROJECT_ROOT}"
}

get_current_branch() {
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

  current_branch="$(get_current_branch)"

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

get_package_name() {
  node -p "require('./package.json').name"
}

get_package_version() {
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

npm_require_login() {
  local registry="${1:-https://registry.npmjs.org}"
  local result
  local npm_status

  result="$(
    trap - ERR
    set +e

    npm whoami --registry "$registry" 2>/dev/null
    npm_status=$?

    printf '\n__NPM_STATUS__=%s\n' "$npm_status"
    exit 0
  )"

  npm_status="$(
    printf '%s\n' "$result" \
      | sed -n 's/^__NPM_STATUS__=//p'
  )"

  NPM_USER="$(
    printf '%s\n' "$result" \
      | sed '/^__NPM_STATUS__=/d' \
      | sed '/^[[:space:]]*$/d'
  )"

  if [[ "$npm_status" == "0" && -n "$NPM_USER" ]]; then
    return 0
  fi

  printf '\nAucune session npm valide.\n' >&2
  printf 'Ouverture de la connexion npm dans le navigateur...\n\n' >&2

  if ! npm login \
    --auth-type=web \
    --registry "$registry"; then
    fail "La connexion à npm a échoué."
  fi

  NPM_USER="$(
    npm whoami \
      --registry "$registry" \
      2>/dev/null
  )"

  [[ -n "$NPM_USER" ]] \
    || fail "L'authentification npm n'a pas pu être confirmée."

  return 0
}

gh_require_login() {
  local hostname="${1:-github.com}"

  if ! gh auth status \
    --hostname "$hostname" >/dev/null 2>&1; then
    printf '\nAucune session GitHub CLI valide.\n' >&2
    printf 'Ouverture de la connexion GitHub dans le navigateur...\n\n' >&2

    if ! gh auth login \
      --hostname "$hostname" \
      --git-protocol ssh \
      --web; then
      fail "La connexion à GitHub a échoué."
    fi
  fi

  GH_USER="$(
    gh api user \
      --hostname "$hostname" \
      --jq '.login' \
      2>/dev/null
  )"

  [[ -n "$GH_USER" ]] \
    || fail "L'authentification GitHub n'a pas pu être confirmée."

  return 0
}

extract_changelog_section() {
  local version="${1:-}"
  local changelog_file="${2:-CHANGELOG.md}"
  local output_file="${3:-}"
  local extractor="${COMMON_PROJECT_ROOT}/scripts/utils/extract-changelog.cjs"

  [[ -n "$version" ]] \
    || fail "Version manquante pour l'extraction du changelog."

  [[ -f "$changelog_file" ]] \
    || fail "Changelog introuvable : ${changelog_file}"

  [[ -n "$output_file" ]] \
    || fail "Fichier de sortie manquant pour les notes de publication."

  [[ -f "$extractor" ]] \
    || fail "Utilitaire d'extraction introuvable : ${extractor}"

  if ! node "$extractor" \
    "$version" \
    "$changelog_file" \
    > "$output_file"; then
    fail "Impossible d'extraire les notes de la version ${version}."
  fi

  [[ -s "$output_file" ]] \
    || fail "Les notes de publication de la version ${version} sont vides."
}

gh_release_exists() {
  local release_tag="${1:-}"

  [[ -n "$release_tag" ]] \
    || return 1

  gh release view "$release_tag" >/dev/null 2>&1
}

gh_create_release() {
  local release_tag="${1:-}"
  local release_title="${2:-$release_tag}"
  local notes_file="${3:-}"

  [[ -n "$release_tag" ]] \
    || fail "Tag manquant pour la Release GitHub."

  [[ -n "$notes_file" && -f "$notes_file" ]] \
    || fail "Fichier de notes GitHub introuvable : ${notes_file}"

  if gh_release_exists "$release_tag"; then
    fail "La Release GitHub ${release_tag} existe déjà."
  fi

  gh release create "$release_tag" \
    --verify-tag \
    --title "$release_title" \
    --notes-file "$notes_file"
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
