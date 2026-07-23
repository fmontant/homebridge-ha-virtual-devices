#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REMOTE_HOST:-homebridge-nas}"
REMOTE_DIR="${REMOTE_DIR:-/tmp/homebridge-ha-virtual-devices-install}"
REMOTE_SCRIPT="${REMOTE_DIR}/install-on-nas.sh"

DOCKER_BIN="${DOCKER_BIN:-/Volume1/@apps/DockerEngine/dockerd/bin/docker}"
CONTAINER_NAME="${HOMEBRIDGE_CONTAINER:-homebridge-homebridge_v13}"
CONTAINER_PACKAGE_DIR="${HOMEBRIDGE_PACKAGE_DIR:-/tmp}"
CONTAINER_PROJECT_DIR="${HOMEBRIDGE_PROJECT_DIR:-/homebridge}"

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

run_docker() {
  "$DOCKER_BIN" "$@"
}

install_remotely() {
  local package_file="${1:-}"
  local package_name="${2:-homebridge-ha-virtual-devices}"
  local expected_version="${3:-}"

  [[ -n "$package_file" ]] \
    || fail "Chemin du paquet manquant."

  [[ -f "$package_file" ]] \
    || fail "Paquet introuvable : ${package_file}"

  [[ -x "$DOCKER_BIN" ]] \
    || fail "Docker introuvable : ${DOCKER_BIN}"

  if ! run_docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    printf 'Conteneurs disponibles :\n' >&2
    run_docker ps --format '  {{.Names}}' >&2 || true
    fail "Conteneur Homebridge introuvable : ${CONTAINER_NAME}"
  fi

  local package_basename
  local container_package
  local status=""
  local installed_version

  package_basename="$(basename "$package_file")"
  container_package="${CONTAINER_PACKAGE_DIR}/${package_basename}"

  line
  printf '%s\n' 'Homebridge HA Virtual Devices — Installation NAS'
  line

  step "Copie du paquet dans le conteneur"
  run_docker cp \
    "$package_file" \
    "${CONTAINER_NAME}:${container_package}"
  success "Paquet copié"

  step "Installation du plugin"
  run_docker exec \
    "$CONTAINER_NAME" \
    sh -lc \
    "cd '$CONTAINER_PROJECT_DIR' && npm install '$container_package'"
  success "Plugin installé"

  step "Nettoyage du paquet dans le conteneur"
  run_docker exec \
    "$CONTAINER_NAME" \
    rm -f "$container_package"
  success "Paquet temporaire supprimé"

  step "Redémarrage de Homebridge"
  run_docker restart "$CONTAINER_NAME" >/dev/null

  for _ in $(seq 1 30); do
    status="$(
      run_docker inspect \
        -f '{{.State.Running}}' \
        "$CONTAINER_NAME" 2>/dev/null || true
    )"

    [[ "$status" == "true" ]] && break
    sleep 1
  done

  [[ "$status" == "true" ]] \
    || fail "Le conteneur Homebridge n'a pas redémarré."

  success "Conteneur redémarré"

  step "Vérification de la version installée"
  installed_version="$(
    run_docker exec \
      "$CONTAINER_NAME" \
      node -p \
      "require('${CONTAINER_PROJECT_DIR}/node_modules/${package_name}/package.json').version"
  )"

  printf 'Version installée : %s\n' "$installed_version"

  if [[ -n "$expected_version" &&
        "$installed_version" != "$expected_version" ]]; then
    fail "Version attendue : ${expected_version} ; version détectée : ${installed_version}"
  fi

  rm -f -- "$package_file"

  line
  printf 'Installation validée : %s %s\n' \
    "$package_name" \
    "$installed_version"
  line
}

install_from_mac() {
  cd "$PROJECT_ROOT"

  trap 'fail "Installation interrompue à la ligne ${LINENO}."' ERR

  line
  printf '%s\n' 'Homebridge HA Virtual Devices — Déploiement NAS'
  line

  step "Vérification des outils"
  command -v node >/dev/null 2>&1 \
    || fail "node est introuvable sur le Mac."
  command -v npm >/dev/null 2>&1 \
    || fail "npm est introuvable sur le Mac."
  command -v ssh >/dev/null 2>&1 \
    || fail "ssh est introuvable sur le Mac."
  success "Outils disponibles"

  local package_name
  local package_version
  local expected_tgz
  local pack_output
  local tgz_file

  package_name="$(node -p "require('./package.json').name")"
  package_version="$(node -p "require('./package.json').version")"
  expected_tgz="${package_name#@*/}-${package_version}.tgz"

  step "Vérification de la connexion SSH"
  ssh \
    -o BatchMode=yes \
    -o ConnectTimeout=10 \
    "$REMOTE_HOST" \
    'printf ok' >/dev/null
  success "Connexion à ${REMOTE_HOST}"

step "Contrôle qualité"

printf '%s\n' '• Correction automatique ESLint'
npm run lint -- --fix
success "Corrections automatiques appliquées"

printf '%s\n' '• Vérification ESLint'
npm run lint
success "Lint validé"

printf '%s\n' '• Compilation complète'
npm run build:all
success "Build validé"

  step "Création du paquet npm"
  rm -f -- "$expected_tgz"

  pack_output="$(npm pack --json)"
  tgz_file="$(
    node -e "
const data = JSON.parse(process.argv[1]);
if (!data[0]?.filename) process.exit(1);
process.stdout.write(data[0].filename);
" "$pack_output"
  )"

  [[ -f "$tgz_file" ]] \
    || fail "Paquet introuvable après npm pack."

  success "Paquet créé : ${tgz_file}"

  step "Préparation du NAS"
  ssh "$REMOTE_HOST" \
    "mkdir -p '$REMOTE_DIR'"
  success "Répertoire distant prêt"

  step "Transfert du paquet par SSH"
  ssh "$REMOTE_HOST" \
    "cat > '${REMOTE_DIR}/${tgz_file}'" \
    < "$tgz_file"
  success "Paquet transféré"

  step "Transfert de l'installateur par SSH"
  ssh "$REMOTE_HOST" \
    "cat > '${REMOTE_SCRIPT}'" \
    < "$PROJECT_ROOT/scripts/install-on-nas.sh"

  ssh "$REMOTE_HOST" \
    "chmod 700 '${REMOTE_SCRIPT}'"
  success "Installateur transféré"

  step "Installation dans Homebridge"
  ssh -t "$REMOTE_HOST" \
    "'${REMOTE_SCRIPT}' --remote \
      '${REMOTE_DIR}/${tgz_file}' \
      '${package_name}' \
      '${package_version}'"
  success "Installation distante terminée"

  step "Nettoyage local"
  rm -f -- "$tgz_file"
  success "Paquet local supprimé"

  line
  printf 'Déploiement terminé avec succès : %s %s\n' \
    "$package_name" \
    "$package_version"
  line
}

case "${1:-}" in
  --remote)
    shift
    install_remotely "$@"
    ;;
  *)
    install_from_mac
    ;;
esac
