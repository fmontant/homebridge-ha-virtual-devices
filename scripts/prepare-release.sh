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
CHANGELOG_FILE="CHANGELOG.md"

TEMP_DIR=""
CURRENT_NOTES_FILE=""
FINAL_NOTES_FILE=""
PREVIEW_CHANGELOG_FILE=""

cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}

trap cleanup EXIT
trap_with_context "Préparation"

extract_changed_entries() {
  local changelog_file="$1"
  local output_file="$2"

  node - "$changelog_file" "$output_file" <<'NODE'
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const changelogFile = process.argv[2];
const outputFile = process.argv[3];
const content = fs.readFileSync(changelogFile, 'utf8').replace(/\r\n?/g, '\n');
const lines = content.split('\n');

const unreleasedIndex = lines.findIndex((line) => /^## \[Unreleased\]\s*$/.test(line));
if (unreleasedIndex === -1) {
  throw new Error('Section ## [Unreleased] introuvable.');
}

let unreleasedEnd = lines.length;
for (let index = unreleasedIndex + 1; index < lines.length; index += 1) {
  if (/^##\s+/.test(lines[index])) {
    unreleasedEnd = index;
    break;
  }
}

let changedIndex = -1;
for (let index = unreleasedIndex + 1; index < unreleasedEnd; index += 1) {
  if (/^### Changed\s*$/.test(lines[index])) {
    changedIndex = index;
    break;
  }
}

if (changedIndex === -1) {
  throw new Error('Section ### Changed introuvable sous ## [Unreleased].');
}

const entries = [];
for (let index = changedIndex + 1; index < unreleasedEnd; index += 1) {
  const line = lines[index];
  if (/^###\s+/.test(line) || /^---\s*$/.test(line)) {
    break;
  }

  const match = line.match(/^\s*-\s+(.+?)\s*$/);
  if (match && match[1]) {
    entries.push(`- ${match[1]}`);
  }
}

fs.writeFileSync(path.resolve(outputFile), entries.join('\n') + (entries.length ? '\n' : ''), 'utf8');
NODE
}

write_changed_entries() {
  local source_file="$1"
  local notes_file="$2"
  local output_file="$3"

  node - "$source_file" "$notes_file" "$output_file" <<'NODE'
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const sourceFile = process.argv[2];
const notesFile = process.argv[3];
const outputFile = process.argv[4];

const content = fs.readFileSync(sourceFile, 'utf8').replace(/\r\n?/g, '\n');
const notes = fs.readFileSync(notesFile, 'utf8')
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.startsWith('- ') ? line : `- ${line}`);

if (notes.length === 0) {
  throw new Error('Aucune note de publication fournie.');
}

const lines = content.split('\n');
const hadFinalNewline = content.endsWith('\n');
if (hadFinalNewline) {
  lines.pop();
}

const unreleasedIndex = lines.findIndex((line) => /^## \[Unreleased\]\s*$/.test(line));
if (unreleasedIndex === -1) {
  throw new Error('Section ## [Unreleased] introuvable.');
}

let unreleasedEnd = lines.length;
for (let index = unreleasedIndex + 1; index < lines.length; index += 1) {
  if (/^##\s+/.test(lines[index])) {
    unreleasedEnd = index;
    break;
  }
}

let changedIndex = -1;
for (let index = unreleasedIndex + 1; index < unreleasedEnd; index += 1) {
  if (/^### Changed\s*$/.test(lines[index])) {
    changedIndex = index;
    break;
  }
}

if (changedIndex === -1) {
  throw new Error('Section ### Changed introuvable sous ## [Unreleased].');
}

let changedEnd = unreleasedEnd;
for (let index = changedIndex + 1; index < unreleasedEnd; index += 1) {
  if (/^###\s+/.test(lines[index]) || /^---\s*$/.test(lines[index])) {
    changedEnd = index;
    break;
  }
}

const replacement = [
  ...lines.slice(0, changedIndex + 1),
  '',
  ...notes,
  '',
  ...lines.slice(changedEnd),
];

while (replacement.length > 0 && replacement[replacement.length - 1] === '') {
  replacement.pop();
}

fs.writeFileSync(path.resolve(outputFile), `${replacement.join('\n')}\n`, 'utf8');
NODE
}

print_notes() {
  local notes_file="$1"

  printf '\n'
  cat "$notes_file"
}

collect_notes() {
  local output_file="$1"
  local append_mode="${2:-false}"
  local entry

  if [[ "$append_mode" != "true" ]]; then
    : > "$output_file"
  fi

  printf '\nSaisissez une note par ligne. Une ligne vide termine la saisie.\n'

  while true; do
    printf '> '
    read -r entry

    [[ -n "$entry" ]] || break

    entry="${entry#- }"
    [[ -n "$entry" ]] || continue
    printf -- '- %s\n' "$entry" >> "$output_file"
  done
}

enter_project_root

banner "Homebridge HA Virtual Devices — Préparation"

step "Vérification des outils"
require_commands git node npm
success "Outils disponibles"

[[ -f "$PREPARE_CHANGELOG_SCRIPT" ]] \
  || fail "Utilitaire introuvable : ${PREPARE_CHANGELOG_SCRIPT}"

[[ -f "$CHANGELOG_FILE" ]] \
  || fail "Changelog introuvable : ${CHANGELOG_FILE}"

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

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/prepare-release.XXXXXX")"
CURRENT_NOTES_FILE="${TEMP_DIR}/current-notes.md"
FINAL_NOTES_FILE="${TEMP_DIR}/final-notes.md"
PREVIEW_CHANGELOG_FILE="${TEMP_DIR}/CHANGELOG.md"

step "Préparation des notes de publication"
extract_changed_entries "$CHANGELOG_FILE" "$CURRENT_NOTES_FILE"

if [[ -s "$CURRENT_NOTES_FILE" ]]; then
  printf 'Notes actuellement présentes :\n'
  print_notes "$CURRENT_NOTES_FILE"

  printf '\n[C] Conserver  [A] Ajouter  [R] Remplacer  [Q] Annuler : '
  read -r NOTES_CHOICE

  case "$NOTES_CHOICE" in
    C|c|'')
      cp "$CURRENT_NOTES_FILE" "$FINAL_NOTES_FILE"
      ;;
    A|a)
      cp "$CURRENT_NOTES_FILE" "$FINAL_NOTES_FILE"
      collect_notes "$FINAL_NOTES_FILE" true
      ;;
    R|r)
      collect_notes "$FINAL_NOTES_FILE" false
      ;;
    Q|q)
      fail "Préparation annulée."
      ;;
    *)
      fail "Choix invalide : ${NOTES_CHOICE}"
      ;;
  esac
else
  printf 'Aucune note de publication trouvée sous ### Changed.\n'
  collect_notes "$FINAL_NOTES_FILE" false
fi

[[ -s "$FINAL_NOTES_FILE" ]] \
  || fail "Au moins une note de publication est requise."

write_changed_entries \
  "$CHANGELOG_FILE" \
  "$FINAL_NOTES_FILE" \
  "$PREVIEW_CHANGELOG_FILE"

PREVIEW_OUTPUT="$(
  node \
    "$PREPARE_CHANGELOG_SCRIPT" \
    --dry-run \
    --file "$PREVIEW_CHANGELOG_FILE" \
    "$TARGET_VERSION"
)"

printf '\n'
line
printf 'Prévisualisation des notes de publication\n'
printf 'Version %s\n' "$TARGET_VERSION"
line

printf '%s\n' \
  "$PREVIEW_OUTPUT" |
  sed \
    -e '/^CHANGELOG[[:space:]]*:/d' \
    -e '/^Date[[:space:]]*:/d' \
    -e '/^Entrées[[:space:]]*:/d' \
    -e '/^Version[[:space:]]*:/d' \
    -e '/^Résultat[[:space:]]*:/d' \
    -e '/^Notes incluses[[:space:]]*:/d' \
    -e '/./,$!d'

line

require_confirmation \
  "Préparer la version ${TARGET_VERSION} ? [oui/N]" \
  "Préparation annulée."

step "Contrôle qualité"
run_quality_checks
success "Lint et build validés"

step "Vérification après compilation"
ensure_no_generated_changes
success "Le build n'a généré aucune modification"

step "Mise à jour du changelog de travail"
write_changed_entries \
  "$CHANGELOG_FILE" \
  "$FINAL_NOTES_FILE" \
  "$CHANGELOG_FILE"
success "Notes de publication enregistrées"

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
