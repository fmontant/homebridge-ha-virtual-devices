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
CONTAINER_PROJECT_DIR="${HOMEBRIDGE_PROJECT_DIR:-/homebridge}"
PACKAGE_NAME="${PACKAGE_NAME:-homebridge-ha-virtual-devices}"
STATE_DIR="${HOMEBRIDGE_STATE_DIR:-/homebridge/ha-virtual-devices}"

trap_with_context "Diagnostic"

enter_project_root

banner "Homebridge HA Virtual Devices — Diagnostic"

step "Vérification des outils locaux"
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

step "Diagnostic du conteneur Homebridge"

ssh -t "$REMOTE_HOST" "
  set -Eeuo pipefail

  source '$REMOTE_COMMON'

  [[ -x '$DOCKER_BIN' ]] \
    || fail 'Docker introuvable : $DOCKER_BIN'

  success 'Docker disponible'

  CONTAINER_NAME=\"\$(
    detect_homebridge_container '$DOCKER_BIN'
  )\"

  success \"Conteneur Homebridge détecté : \$CONTAINER_NAME\"

  RUNNING=\"\$(
    '$DOCKER_BIN' inspect \
      -f '{{.State.Running}}' \
      \"\$CONTAINER_NAME\"
  )\"

  [[ \"\$RUNNING\" == 'true' ]] \
    || fail 'Le conteneur Homebridge est arrêté.'

  success 'Conteneur Homebridge actif'

  NODE_VERSION=\"\$(
    '$DOCKER_BIN' exec \
      \"\$CONTAINER_NAME\" \
      node -v
  )\"

  NPM_VERSION=\"\$(
    '$DOCKER_BIN' exec \
      \"\$CONTAINER_NAME\" \
      npm -v
  )\"

  HOMEBRIDGE_VERSION=\"\$(
    '$DOCKER_BIN' exec \
      \"\$CONTAINER_NAME\" \
      sh -lc 'homebridge -V'
  )\"

  PLUGIN_VERSION=\"\$(
    '$DOCKER_BIN' exec \
      \"\$CONTAINER_NAME\" \
      node -p \
      \"require('$CONTAINER_PROJECT_DIR/node_modules/$PACKAGE_NAME/package.json').version\"
  )\"

  printf '✓ Node.js : %s\n' \"\$NODE_VERSION\"
  printf '✓ npm : %s\n' \"\$NPM_VERSION\"
  printf '✓ Homebridge : %s\n' \"\$HOMEBRIDGE_VERSION\"
  printf '✓ Plugin : %s %s\n' '$PACKAGE_NAME' \"\$PLUGIN_VERSION\"

  '$DOCKER_BIN' exec \
    \"\$CONTAINER_NAME\" \
    test -f '$STATE_DIR/device-catalog.json' \
    || fail 'Catalogue introuvable : $STATE_DIR/device-catalog.json'

  success 'Catalogue présent'

  '$DOCKER_BIN' exec \
    \"\$CONTAINER_NAME\" \
    test -f '$STATE_DIR/plugin-state.json' \
    || fail 'État du plugin introuvable : $STATE_DIR/plugin-state.json'

  success 'État du plugin présent'
"

line
printf 'Diagnostic terminé avec succès\n'
line
