#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
RELEASE_BRANCH="${RELEASE_BRANCH:-main}"

trap_with_context "Publication"

enter_project_root

banner "Homebridge HA Virtual Devices — Publication"

step "Vérification des outils"
require_commands git node npm
success "Outils disponibles"

git_require_repository
git_require_head

PACKAGE_NAME="$(package_name)"
PACKAGE_VERSION="$(package_version)"
RELEASE_TAG="v${PACKAGE_VERSION}"
CURRENT_BRANCH="$(git_current_branch)"

step "Vérification de la branche Git"
git_require_branch "$RELEASE_BRANCH"
success "Branche ${CURRENT_BRANCH}"

step "Vérification du dépôt Git"
git_require_clean
success "Dépôt propre"

step "Vérification de la synchronisation GitHub"
git_fetch_branch origin "$RELEASE_BRANCH" true
git_require_synced origin "$RELEASE_BRANCH"
success "Dépôt synchronisé avec GitHub"

step "Vérification de l'authentification npm"
NPM_USER="$(npm_require_login "$NPM_REGISTRY")"
success "Compte npm : ${NPM_USER}"

step "Vérification de la version"
require_semver \
  "$PACKAGE_VERSION" \
  "Version invalide dans package.json"

if npm_version_exists \
  "${PACKAGE_NAME}@${PACKAGE_VERSION}" \
  "$NPM_REGISTRY"; then
  fail "La version ${PACKAGE_VERSION} existe déjà sur npm."
fi

if git_tag_exists_local "$RELEASE_TAG"; then
  fail "Le tag local ${RELEASE_TAG} existe déjà."
fi

if git_tag_exists_remote origin "$RELEASE_TAG"; then
  fail "Le tag distant ${RELEASE_TAG} existe déjà."
fi

success "Version disponible : ${PACKAGE_VERSION}"

step "Contrôle qualité"
run_quality_checks
success "Lint et build validés"

step "Vérification après compilation"
ensure_no_generated_changes
success "Le build n'a généré aucune modification"

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

require_confirmation \
  "Confirmer la publication officielle ? [oui/N]" \
  "Publication annulée."

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
