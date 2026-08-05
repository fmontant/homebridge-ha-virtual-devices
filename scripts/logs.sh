#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

REMOTE_HOST="${REMOTE_HOST:-homebridge-nas}"
REMOTE_DIR="${REMOTE_DIR:-/tmp/homebridge-ha-virtual-devices-install}"
REMOTE_LIB_DIR="${REMOTE_DIR}/lib"
REMOTE_COMMON="${REMOTE_LIB_DIR}/common.sh"

DOCKER_BIN="${DOCKER_BIN:-/Volume1/@apps/DockerEngine/dockerd/bin/docker}"
FILTER_INPUT="${1:-}"
FILTER=""

show_help() {
  cat <<'EOF'
Homebridge HA Virtual Devices — Journaux

Utilisation :

  npm run logs
      Affiche tous les journaux Homebridge.

  npm run logs -- homekit
      Affiche les journaux [HOMEKIT].

  npm run logs -- ws
      Affiche les journaux [WS].

  npm run logs -- device
      Affiche les journaux [DEVICE].

  npm run logs -- catalog
      Affiche les journaux [CATALOG].

  npm run logs -- event
      Affiche les journaux [EVENT].

  npm run logs -- <texte>
      Recherche libre, par exemple :
      npm run logs -- Terrasse

  Ctrl + C
      Quitte l'affichage en direct.
EOF
}

case "$(
  printf '%s' "$FILTER_INPUT" |
    tr '[:upper:]' '[:lower:]'
)" in
  help|-h|--help)
    show_help
    exit 0
    ;;
  homekit)
    FILTER='[HOMEKIT]'
    ;;
  ws)
    FILTER='[WS]'
    ;;
  device)
    FILTER='[DEVICE]'
    ;;
  catalog)
    FILTER='[CATALOG]'
    ;;
  event)
    FILTER='[EVENT]'
    ;;
  *)
    FILTER="$FILTER_INPUT"
    ;;
esac

trap_with_context "Journaux"

enter_project_root

banner "Homebridge HA Virtual Devices — Journaux"

step "Vérification des outils"
require_commands ssh
success "Outils disponibles"

step "Vérification de la connexion SSH"
ssh \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  "$REMOTE_HOST" \
  'printf ok' >/dev/null
success "Connexion à ${REMOTE_HOST}"

step "Préparation de la bibliothèque commune"
ssh "$REMOTE_HOST" \
  "mkdir -p '$REMOTE_LIB_DIR'"

ssh "$REMOTE_HOST" \
  "cat > '$REMOTE_COMMON'" \
  < "${SCRIPT_DIR}/lib/common.sh"

ssh "$REMOTE_HOST" \
  "chmod 600 '$REMOTE_COMMON'"
success "Bibliothèque commune prête"

FILTER_QUOTED="$(printf '%q' "$FILTER")"

step "Connexion aux journaux Homebridge"

INTERRUPTED=false

trap 'INTERRUPTED=true' INT
trap - ERR
set +e

ssh -t "$REMOTE_HOST" "
  set -Eeuo pipefail

  source '$REMOTE_COMMON'

  CONTAINER_NAME=\"\$(
    detect_homebridge_container '$DOCKER_BIN'
  )\"

  printf '✓ Conteneur Homebridge détecté : %s\n' \"\$CONTAINER_NAME\"

  if [[ -n $FILTER_QUOTED ]]; then
    printf '✓ Filtre actif : %s\n\n' $FILTER_QUOTED

    '$DOCKER_BIN' logs -f \"\$CONTAINER_NAME\" 2>&1 |
      awk -v filter=$FILTER_QUOTED '
        index(tolower(\$0), tolower(filter)) {
          print
          fflush()
        }
      '
  else
    printf '✓ Tous les journaux sont affichés\n\n'

    '$DOCKER_BIN' logs -f \"\$CONTAINER_NAME\" 2>&1
  fi
"

SSH_STATUS=$?

set -e
trap - INT
trap_with_context "Journaux"

if [[ "$INTERRUPTED" == "true" ||
      "$SSH_STATUS" == "130" ||
      "$SSH_STATUS" == "255" ]]; then
  printf '\n'
  success "Affichage des journaux terminé"
  exit 0
fi

[[ "$SSH_STATUS" == "0" ]] \
  || fail "La consultation des journaux a échoué."
