#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-homebridge-nas}"
REMOTE_DIR="${REMOTE_DIR:-/tmp/homebridge-ha-virtual-devices-deploy}"
REMOTE_INSTALLER="${REMOTE_DIR}/install-on-nas.sh"

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

trap 'fail "Déploiement interrompu à la ligne ${LINENO}."' ERR

line
printf '%s\n' 'Homebridge HA Virtual Devices — Déploiement'
line

command -v npm >/dev/null 2>&1 || fail "npm est introuvable sur le Mac."
command -v ssh >/dev/null 2>&1 || fail "ssh est introuvable sur le Mac."
command -v scp >/dev/null 2>&1 || fail "scp est introuvable sur le Mac."

PACKAGE_NAME="$(node -p "require('./package.json').name")"
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
EXPECTED_TGZ="${PACKAGE_NAME#@*/}-${PACKAGE_VERSION}.tgz"

step "Vérification de la connexion SSH"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" 'printf ok' >/dev/null
success "Connexion à ${REMOTE_HOST}"

step "Build complet"
npm run build:all
success "Build terminé"

step "Création du paquet npm"
rm -f -- "$EXPECTED_TGZ"
PACK_OUTPUT="$(npm pack --json)"
TGZ_FILE="$(node -e "const d=JSON.parse(process.argv[1]); if(!d[0]?.filename) process.exit(1); process.stdout.write(d[0].filename);" "$PACK_OUTPUT")"
[[ -f "$TGZ_FILE" ]] || fail "Paquet introuvable après npm pack."
success "Paquet créé : ${TGZ_FILE}"

step "Préparation du répertoire distant"
ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
success "Répertoire distant prêt"

step "Copie sur le NAS"

ssh "$REMOTE_HOST" \
  "cat > '${REMOTE_DIR}/${TGZ_FILE}'" \
  < "$TGZ_FILE"

ssh "$REMOTE_HOST" \
  "cat > '${REMOTE_INSTALLER}'" \
  < "$PROJECT_ROOT/scripts/install-on-nas.sh"

ssh "$REMOTE_HOST" \
  "chmod +x '${REMOTE_INSTALLER}'"

success "Fichiers copiés"

step "Installation dans Homebridge"
ssh -t "$REMOTE_HOST" \
  "chmod 700 '$REMOTE_INSTALLER' && '$REMOTE_INSTALLER' '$REMOTE_DIR/$TGZ_FILE' '$PACKAGE_NAME' '$PACKAGE_VERSION'"
success "Installation distante terminée"

step "Nettoyage local"
rm -f -- "$TGZ_FILE"
success "Paquet local supprimé"

line
printf 'Déploiement terminé avec succès : %s %s\n' "$PACKAGE_NAME" "$PACKAGE_VERSION"
line
