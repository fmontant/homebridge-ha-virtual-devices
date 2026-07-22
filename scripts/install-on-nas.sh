#!/usr/bin/env bash
set -Eeuo pipefail

PACKAGE_FILE="${1:-}"
PACKAGE_NAME="${2:-homebridge-ha-virtual-devices}"
EXPECTED_VERSION="${3:-}"

DOCKER_BIN="${DOCKER_BIN:-/Volume1/@apps/DockerEngine/dockerd/bin/docker}"
CONTAINER_NAME="${HOMEBRIDGE_CONTAINER:-homebridge-homebridge_v13}"
CONTAINER_PACKAGE_DIR="${HOMEBRIDGE_PACKAGE_DIR:-/tmp}"
CONTAINER_PROJECT_DIR="${HOMEBRIDGE_PROJECT_DIR:-/homebridge}"

fail() {
  printf '✗ %s\n' "$1" >&2
  exit 1
}

run_docker() {
  "$DOCKER_BIN" "$@"
}

[[ -n "$PACKAGE_FILE" ]] \
  || fail "Chemin du paquet manquant."

[[ -f "$PACKAGE_FILE" ]] \
  || fail "Paquet introuvable : $PACKAGE_FILE"

[[ -x "$DOCKER_BIN" ]] \
  || fail "Docker introuvable : $DOCKER_BIN"

if ! run_docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  printf 'Conteneurs disponibles :\n' >&2
  run_docker ps --format '  {{.Names}}' >&2 || true
  fail "Conteneur Homebridge introuvable : $CONTAINER_NAME"
fi

PACKAGE_BASENAME="$(basename "$PACKAGE_FILE")"
CONTAINER_PACKAGE="${CONTAINER_PACKAGE_DIR}/${PACKAGE_BASENAME}"

printf '▶ Copie du paquet dans le conteneur\n'
run_docker cp \
  "$PACKAGE_FILE" \
  "${CONTAINER_NAME}:${CONTAINER_PACKAGE}"

printf '▶ Installation du plugin\n'
run_docker exec \
  "$CONTAINER_NAME" \
  sh -lc \
  "cd '$CONTAINER_PROJECT_DIR' && npm install '$CONTAINER_PACKAGE'"

printf '▶ Nettoyage du paquet temporaire\n'
run_docker exec \
  "$CONTAINER_NAME" \
  rm -f "$CONTAINER_PACKAGE"

printf '▶ Redémarrage du conteneur\n'
run_docker restart \
  "$CONTAINER_NAME" >/dev/null

printf '▶ Attente du redémarrage\n'

for _ in $(seq 1 30); do
  STATUS="$(
    run_docker inspect \
      -f '{{.State.Running}}' \
      "$CONTAINER_NAME" 2>/dev/null || true
  )"

  [[ "$STATUS" == "true" ]] && break

  sleep 1
done

[[ "$STATUS" == "true" ]] \
  || fail "Le conteneur n'a pas redémarré."

printf '▶ Vérification de la version installée\n'

INSTALLED_VERSION="$(
run_docker exec \
  "$CONTAINER_NAME" \
  node -p \
  "require('${CONTAINER_PROJECT_DIR}/node_modules/${PACKAGE_NAME}/package.json').version"
)"

printf 'Version installée : %s\n' "$INSTALLED_VERSION"

if [[ -n "$EXPECTED_VERSION" &&
      "$INSTALLED_VERSION" != "$EXPECTED_VERSION" ]]; then
  fail "Version attendue : $EXPECTED_VERSION ; version détectée : $INSTALLED_VERSION"
fi

rm -f "$PACKAGE_FILE"

printf '✓ Installation validée\n'