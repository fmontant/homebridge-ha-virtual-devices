#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
PREPARE_CHANGELOG_SCRIPT="${SCRIPT_DIR}/utils/prepare-changelog.cjs"

trap_with_context "Préparation"

enter_project_root

banner "Homebridge HA Virtual Devices — Préparation"

step "Vérification des outils"
require_commands git node npm
success "Outils disponibles"

[[ -f "$PREPARE_CHANGELOG_SCRIPT" ]] \
  || fail "Utilitaire introuvable : ${PREPARE_CHANGELOG_SCRIPT}"

git_require_repository
git_require_head

CURRENT_BRANCH="$(get_current_branch)"
CURRENT_VERSION="$(get_package_version)"

step "Vérification de la branche Git"
git_require_branch "$RELEASE_BRANCH"
success "Branche ${CURRENT_BRANCH}"

step "Vérification du dépôt Git"
git_require_clean
success "Dépôt propre"

step "Vérification de la synchronisation GitHub"
git_fetch_branch origin "$RELEASE_BRANCH"
git_require_synced origin "$RELEASE_BRANCH"
success "Dépôt synchronisé avec GitHub"

PATCH_VERSION="$(next_patch_version "$CURRENT_VERSION")"
MINOR_VERSION="$(next_minor_version "$CURRENT_VERSION")"
MAJOR_VERSION="$(next_major_version "$CURRENT_VERSION")"

line
printf 'Version actuelle : %s\n' "$CURRENT_VERSION"
printf '\n'
printf '1) patch  → %s [défaut]\n' "$PATCH_VERSION"
printf '2) minor  → %s\n' "$MINOR_VERSION"
printf '3) major  → %s\n' "$MAJOR_VERSION"
printf '4) version personnalisée\n'
line

printf '\nChoisir le type de version [1] : '
read -r VERSION_CHOICE
VERSION_CHOICE="${VERSION_CHOICE:-1}"

case "$VERSION_CHOICE" in
  1|patch)
    TARGET_VERSION="$PATCH_VERSION"
    ;;
  2|minor)
    TARGET_VERSION="$MINOR_VERSION"
    ;;
  3|major)
    TARGET_VERSION="$MAJOR_VERSION"
    ;;
  4|custom)
    printf 'Saisir la version souhaitée : '
    read -r TARGET_VERSION
    ;;
  *)
    fail "Choix invalide : ${VERSION_CHOICE}"
    ;;
esac

require_semver \
  "$TARGET_VERSION" \
  "Version invalide"

[[ "$TARGET_VERSION" != "$CURRENT_VERSION" ]] \
  || fail "La nouvelle version doit être différente de ${CURRENT_VERSION}."

line
printf 'Version actuelle : %s\n' "$CURRENT_VERSION"
printf 'Nouvelle version : %s\n' "$TARGET_VERSION"
line

require_confirmation \
  "Préparer la version ${TARGET_VERSION} ? [oui/N]" \
  "Préparation annulée."

step "Validation du changelog"
node \
  "$PREPARE_CHANGELOG_SCRIPT" \
  --dry-run \
  "$TARGET_VERSION"
success "Changelog prêt pour la version ${TARGET_VERSION}"

step "Contrôle qualité"
run_quality_checks
success "Lint et build validés"

step "Vérification après compilation"
ensure_no_generated_changes
success "Le build n'a généré aucune modification"

step "Mise à jour de la version"
npm version "$TARGET_VERSION" --no-git-tag-version >/dev/null

NEW_VERSION="$(get_package_version)"

[[ "$NEW_VERSION" == "$TARGET_VERSION" ]] \
  || fail "La version obtenue (${NEW_VERSION}) ne correspond pas à la version demandée (${TARGET_VERSION})."

success "Version mise à jour : ${NEW_VERSION}"

step "Mise à jour du changelog"
node \
  "$PREPARE_CHANGELOG_SCRIPT" \
  --write \
  "$NEW_VERSION"
success "Changelog préparé pour la version ${NEW_VERSION}"

step "Vérification des fichiers modifiés"
MODIFIED_FILES="$(
  git status --porcelain |
    awk '{print $2}'
)"

EXPECTED_FILES="$(
  printf '%s\n' \
    CHANGELOG.md \
    package-lock.json \
    package.json
)"

ACTUAL_FILES="$(
  printf '%s\n' "$MODIFIED_FILES" |
    sort
)"

EXPECTED_SORTED="$(
  printf '%s\n' "$EXPECTED_FILES" |
    sort
)"

[[ "$ACTUAL_FILES" == "$EXPECTED_SORTED" ]] \
  || fail "Des fichiers inattendus ont été modifiés :
${MODIFIED_FILES}"

success "Seuls CHANGELOG.md, package.json et package-lock.json ont été modifiés"

step "Création du commit"
git add \
  CHANGELOG.md \
  package.json \
  package-lock.json

git commit \
  -m "chore: prepare version ${NEW_VERSION}"

success "Commit de préparation créé"

step "Publication du commit sur GitHub"
git push origin "$RELEASE_BRANCH"
success "Commit publié sur GitHub"

line
printf 'Préparation terminée avec succès\n'
printf 'Version : %s\n' "$NEW_VERSION"
printf '\nÉtape suivante : npm run release\n'
line
