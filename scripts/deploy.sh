#!/bin/bash

set -e

TARGET="/Volumes/public/homebridge/homebridge-ha-virtual-devices"
ARCHIVE_NAME="homebridge-ha-virtual-devices-1.0.0.tgz"
ARCHIVE_TARGET="/Volumes/public/homebridge/$ARCHIVE_NAME"

echo "Compilation..."
npm run build

echo "Création du paquet..."
npm pack --silent

echo "Copie vers le TerraMaster..."
cp "$ARCHIVE_NAME" "$ARCHIVE_TARGET"

echo "Mise à jour du plugin..."
rm -rf "$TARGET/dist"

tar -xzf "$ARCHIVE_TARGET" \
  -C "$TARGET" \
  --strip-components=1

echo "Déploiement terminé."
echo "Il reste à redémarrer le conteneur Homebridge."