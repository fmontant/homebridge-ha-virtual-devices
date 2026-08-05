#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd
)"

# shellcheck source=scripts/lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

trap_with_context "Développement"

enter_project_root

banner "Homebridge HA Virtual Devices — Développement"

step "Déploiement sur le NAS"
npm run install-on-nas
success "Déploiement terminé"

step "Diagnostic de l'installation"
npm run doctor
success "Diagnostic validé"

line
printf 'Environnement de développement prêt
'
line
