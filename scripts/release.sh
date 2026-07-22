#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
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

trap 'fail "Publication interrompue à la ligne ${LINENO}."' ERR

line
printf '%s\n' 'Homebridge HA Virtual Devices — Publication'
line

step "Vérification des outils"
command -v git >/dev/null 2>&1 || fail "git est introuvable."
command -v node >/dev/null 2>&1 || fail "node est introuvable."
command -v npm >/dev/null 2>&1 || fail "npm est introuvable."
success "Outils disponibles"

PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
RELEASE_TAG="v${PACKAGE_VERSION}"
CURRENT_BRANCH="$(git branch --show-current)"

step "Vérification de la branche Git"
[[ "$CURRENT_BRANCH" == "$RELEASE_BRANCH" ]] || \
  fail "Branche courante : ${CURRENT_BRANCH}. La publication doit être lancée depuis ${RELEASE_BRANCH}."
success "Branche ${CURRENT_BRANCH}"

step "Vérification du dépôt Git"
[[ -z "$(git status --porcelain)" ]] || \
  fail "Le dépôt contient des modifications non validées."
git rev-parse --verify HEAD >/dev/null
success "Dépôt propre"

step "Vérification de la synchronisation GitHub"
git fetch origin "$RELEASE_BRANCH" --tags --quiet
LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/${RELEASE_BRANCH}")"
[[ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]] || \
  fail "La branche locale n'est pas synchronisée avec origin/${RELEASE_BRANCH}."
success "Dépôt synchronisé avec GitHub"

step "Vérification de l'authentification npm"
NPM_USER="$(npm whoami --registry "$NPM_REGISTRY")"
success "Compte npm : ${NPM_USER}"

step "Vérification de la version"
[[ "$PACKAGE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || \
  fail "Version invalide dans package.json : ${PACKAGE_VERSION}"

if npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version \
  --registry "$NPM_REGISTRY" >/dev/null 2>&1; then
  fail "La version ${PACKAGE_VERSION} existe déjà sur npm."
fi

if git rev-parse "$RELEASE_TAG" >/dev/null 2>&1; then
  fail "Le tag local ${RELEASE_TAG} existe déjà."
fi

if git ls-remote --exit-code --tags origin "refs/tags/${RELEASE_TAG}" \
  >/dev/null 2>&1; then
  fail "Le tag distant ${RELEASE_TAG} existe déjà."
fi

success "Version disponible : ${PACKAGE_VERSION}"

step "Contrôle qualité"
npm run lint
npm run build:all
success "Lint et build validés"

step "Contrôle du contenu du paquet"
PACK_OUTPUT="$(npm pack --dry-run --json)"
PACK_FILENAME="$(node -e "
const data = JSON.parse(process.argv[1]);
if (!data[0]?.filename) process.exit(1);
process.stdout.write(data[0].filename);
" "$PACK_OUTPUT")"
success "Paquet validé : ${PACK_FILENAME}"

line
printf 'Paquet  : %s\n' "$PACKAGE_NAME"
printf 'Version : %s\n' "$PACKAGE_VERSION"
printf 'Tag     : %s\n' "$RELEASE_TAG"
printf 'Compte  : %s\n' "$NPM_USER"
line

printf '\nConfirmer la publication officielle ? [oui/N] '
read -r CONFIRMATION

[[ "$CONFIRMATION" == "oui" ]] || fail "Publication annulée."

step "Publication sur npm"
npm publish --registry "$NPM_REGISTRY"
success "Version ${PACKAGE_VERSION} publiée sur npm"

step "Création du tag Git"
git tag -a "$RELEASE_TAG" -m "Release ${RELEASE_TAG}"
success "Tag ${RELEASE_TAG} créé"

step "Publication GitHub"
git push origin "$RELEASE_BRANCH"
git push origin "$RELEASE_TAG"
success "Branche et tag publiés sur GitHub"

line
printf 'Publication terminée avec succès\n'
printf 'npm    : %s@%s\n' "$PACKAGE_NAME" "$PACKAGE_VERSION"
printf 'GitHub : %s\n' "$RELEASE_TAG"
line
