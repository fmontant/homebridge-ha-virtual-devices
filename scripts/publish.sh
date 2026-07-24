#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

MODE="standard"
SKIP_NAS="false"
CURRENT_STEP="Initialisation"
START_TIME="$(date +%s)"

usage() {
  cat <<'EOF'
Usage:
  npm run toolkit:publish
  npm run toolkit:publish -- --skip-nas
  npm run toolkit:publish -- --prepare-only
  npm run toolkit:publish -- --release-only
  npm run toolkit:publish -- --install-only
  npm run toolkit:publish -- --help

Options:
  --skip-nas       Prépare et publie la version sans la déployer sur le NAS.
  --prepare-only   Exécute uniquement la préparation de la version.
  --release-only   Exécute uniquement la publication npm et GitHub.
  --install-only   Exécute uniquement le déploiement sur le NAS.
  --help           Affiche cette aide.
EOF
}

fail_publish() {
  local line_number="${1:-inconnue}"
  local exit_code="${2:-1}"

  printf '\n' >&2
  line >&2
  printf '%s\n' 'Publication interrompue' >&2
  printf 'Étape : %s\n' "$CURRENT_STEP" >&2
  printf 'Ligne : %s\n' "$line_number" >&2
  line >&2

  exit "$exit_code"
}

trap 'fail_publish "${LINENO}" "$?"' ERR

set_mode() {
  local requested_mode="${1:-}"

  if [[ "$MODE" != "standard" ]]; then
    printf '✗ Les modes --prepare-only, --release-only et --install-only sont exclusifs.\n' >&2
    exit 2
  fi

  MODE="$requested_mode"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-nas)
      SKIP_NAS="true"
      ;;
    --prepare-only)
      set_mode "prepare"
      ;;
    --release-only)
      set_mode "release"
      ;;
    --install-only)
      set_mode "install"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf '✗ Option inconnue : %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac

  shift
done

if [[ "$MODE" != "standard" && "$SKIP_NAS" == "true" ]]; then
  printf '✗ --skip-nas ne peut être utilisé qu’en mode standard.\n' >&2
  exit 2
fi

enter_project_root

CURRENT_STEP="Vérification de l’environnement"
require_commands npm node
PACKAGE_NAME="$(get_package_name)"
INITIAL_VERSION="$(get_package_version)"

banner "Homebridge HA Virtual Devices — Publication Assistant"

printf 'Paquet  : %s\n' "$PACKAGE_NAME"
printf 'Version : %s\n' "$INITIAL_VERSION"
printf '\nPlan d’exécution\n'

case "$MODE" in
  standard)
    printf '  1. Préparation de la version\n'
    printf '  2. Publication npm et GitHub\n'
    if [[ "$SKIP_NAS" == "false" ]]; then
      printf '  3. Déploiement sur le NAS\n'
    else
      printf '  3. Déploiement sur le NAS — ignoré\n'
    fi
    ;;
  prepare)
    printf '  1. Préparation de la version uniquement\n'
    ;;
  release)
    printf '  1. Publication npm et GitHub uniquement\n'
    ;;
  install)
    printf '  1. Déploiement sur le NAS uniquement\n'
    ;;
esac

run_step() {
  local label="${1:-Étape}"
  local npm_script="${2:-}"

  CURRENT_STEP="$label"

  step "$label"
  npm run "$npm_script"
  success "$label terminée"
}

case "$MODE" in
  standard)
    run_step "Préparation de la version" "toolkit:prepare"
    run_step "Publication npm et GitHub" "toolkit:release"

    if [[ "$SKIP_NAS" == "false" ]]; then
      run_step "Déploiement sur le NAS" "toolkit:install"
    fi
    ;;
  prepare)
    run_step "Préparation de la version" "toolkit:prepare"
    ;;
  release)
    run_step "Publication npm et GitHub" "toolkit:release"
    ;;
  install)
    run_step "Déploiement sur le NAS" "toolkit:install"
    ;;
esac

CURRENT_STEP="Résumé final"
FINAL_VERSION="$(get_package_version)"
END_TIME="$(date +%s)"
DURATION_SECONDS="$((END_TIME - START_TIME))"
DURATION_MINUTES="$((DURATION_SECONDS / 60))"
DURATION_REMAINDER="$((DURATION_SECONDS % 60))"

line
printf '%s\n' 'Publication terminée avec succès'
printf 'Paquet  : %s\n' "$PACKAGE_NAME"
printf 'Version : %s\n' "$FINAL_VERSION"
printf 'Durée   : %d min %02d s\n' \
  "$DURATION_MINUTES" \
  "$DURATION_REMAINDER"
line
