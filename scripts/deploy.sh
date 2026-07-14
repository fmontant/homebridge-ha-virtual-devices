#!/bin/bash

set -e

SERVER="TNASFAB"
SHARE="public"

SHARE_ROOT="/Volumes/$SHARE"
HOMEBRIDGE_ROOT="$SHARE_ROOT/homebridge"
TARGET="$HOMEBRIDGE_ROOT/homebridge-ha-virtual-devices"

if [ ! -d "$SHARE_ROOT" ] || ! ls "$SHARE_ROOT" >/dev/null 2>&1; then
  echo "Connexion au TerraMaster..."

  osascript -e "mount volume \"smb://$SERVER/$SHARE\"" >/dev/null 2>&1 || true

  sleep 3
fi

if [ ! -d "$HOMEBRIDGE_ROOT" ] || ! ls "$HOMEBRIDGE_ROOT" >/dev/null 2>&1; then
  echo "Erreur : impossible d'accéder au partage TerraMaster."
  exit 1
fi

if [ ! -d "$TARGET" ]; then
  echo "Erreur : dossier cible introuvable :"
  echo "$TARGET"
  exit 1
fi

echo "Compilation..."
npm run build

echo "Mise à jour du plugin..."

echo "Synchronisation du dist..."
mkdir -p "$TARGET/dist"
time rsync -rt --inplace --delete dist/ "$TARGET/dist/"

echo "Copie du package.json..."
time cp package.json "$TARGET/package.json"

echo "Copie du config.schema.json..."
time cp config.schema.json "$TARGET/config.schema.json"

echo "Copie du README.md..."
time cp README.md "$TARGET/README.md"

echo "Copie du LICENSE..."
time cp LICENSE "$TARGET/LICENSE"

echo "Déploiement terminé."
echo "Il reste à redémarrer le conteneur Homebridge."