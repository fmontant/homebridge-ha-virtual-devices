#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_BRANCH="${RELEASE_BRANCH:-main}"

cd "$PROJECT_ROOT"

line() {
  printf '%s\n' '────────────────────────────────────────'
}

step() {
  printf '\n▶ %s\n' "$1"
}

success() {
  printf '✓ %s\n' "$1"
}

fail() {
  printf '✗ %s\n' "$1" >&2
  exit 1
}

trap 'fail "Préparation interrompue à la ligne ${LINENO}."' ERR

line
printf '%s\n' 'Homebridge HA Virtual Devices — Préparation'
line

step "Vérification des outils"
command -v git >/dev/null 2>&1 || fail "git est introuvable."
command -v node >/dev/null 2>&1 || fail "node est introuvable."
command -v npm >/dev/null 2>&1 || fail "npm est introuvable."
success "Outils disponibles"

CURRENT_BRANCH="$(git branch --show-current)"
CURRENT_VERSION="$(node -p "require('./package.json').version")"

step "Vérification de la branche Git"
[[ "$CURRENT_BRANCH" == "$RELEASE_BRANCH" ]] || \
  fail "Branche courante : ${CURRENT_BRANCH}. La préparation doit être lancée depuis ${RELEASE_BRANCH}."
success "Branche ${CURRENT_BRANCH}"

step "Vérification du dépôt Git"
[[ -z "$(git status --porcelain)" ]] || \
  fail "Le dépôt contient des modifications non validées."
git rev-parse --verify HEAD >/dev/null
success "Dépôt propre"

step "Vérification de la synchronisation GitHub"
git fetch origin "$RELEASE_BRANCH" --quiet
LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/${RELEASE_BRANCH}")"
[[ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]] || \
  fail "La branche locale n'est pas synchronisée avec origin/${RELEASE_BRANCH}."
success "Dépôt synchronisé avec GitHub"

PATCH_VERSION="$(node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0], version[1], version[2] + 1].join('.'));
" "$CURRENT_VERSION")"

MINOR_VERSION="$(node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0], version[1] + 1, 0].join('.'));
" "$CURRENT_VERSION")"

MAJOR_VERSION="$(node -e "
const version = process.argv[1].split('.').map(Number);
if (version.length !== 3 || version.some(Number.isNaN)) process.exit(1);
process.stdout.write([version[0] + 1, 0, 0].join('.'));
" "$CURRENT_VERSION")"

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

[[ "$TARGET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || \
  fail "Version invalide : ${TARGET_VERSION}"

[[ "$TARGET_VERSION" != "$CURRENT_VERSION" ]] || \
  fail "La nouvelle version doit être différente de ${CURRENT_VERSION}."

line
printf 'Version actuelle : %s\n' "$CURRENT_VERSION"
printf 'Nouvelle version : %s\n' "$TARGET_VERSION"
line

printf '\nPréparer la version %s ? [oui/N] ' "$TARGET_VERSION"
read -r CONFIRMATION

[[ "$CONFIRMATION" == "oui" ]] || fail "Préparation annulée."

step "Contrôle qualité"
npm run lint
npm run build:all
success "Lint et build validés"

step "Vérification après compilation"
[[ -z "$(git status --porcelain)" ]] || \
  fail "Le build a généré des modifications. Vérifiez-les et validez-les avant de préparer la version."
success "Le build n'a généré aucune modification"

step "Mise à jour de la version"
npm version "$TARGET_VERSION" --no-git-tag-version >/dev/null
NEW_VERSION="$(node -p "require('./package.json').version")"
[[ "$NEW_VERSION" == "$TARGET_VERSION" ]] || \
  fail "La version obtenue (${NEW_VERSION}) ne correspond pas à la version demandée (${TARGET_VERSION})."
success "Version mise à jour : ${NEW_VERSION}"

step "Vérification des fichiers modifiés"
MODIFIED_FILES="$(git status --porcelain | awk '{print $2}')"
EXPECTED_FILES="$(printf '%s\n' package-lock.json package.json)"
ACTUAL_FILES="$(printf '%s\n' "$MODIFIED_FILES" | sort)"
EXPECTED_SORTED="$(printf '%s\n' "$EXPECTED_FILES" | sort)"

[[ "$ACTUAL_FILES" == "$EXPECTED_SORTED" ]] || \
  fail "Des fichiers inattendus ont été modifiés :
${MODIFIED_FILES}"
success "Seuls package.json et package-lock.json ont été modifiés"

step "Création du commit"
git add package.json package-lock.json
git commit -m "chore: bump version to ${NEW_VERSION}"
success "Commit de version créé"

step "Publication du commit sur GitHub"
git push origin "$RELEASE_BRANCH"
success "Commit publié sur GitHub"

line
printf 'Préparation terminée avec succès\n'
printf 'Version : %s\n' "$NEW_VERSION"
printf '\nÉtape suivante : npm run release\n'
line
