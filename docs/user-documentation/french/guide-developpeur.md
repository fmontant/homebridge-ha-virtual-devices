# Guide développeur

Ce document s'adresse aux développeurs souhaitant comprendre, maintenir ou faire évoluer **Homebridge HA Virtual Devices**.

Il présente l'organisation du projet, les conventions de développement et le cycle de vie des principaux composants.

---

# Objectifs du projet

Le plugin a pour objectif de créer une passerelle fiable entre **Home Assistant** et **Apple Home**.

Ses principaux objectifs sont :

- découvrir automatiquement les capteurs compatibles ;
- publier des accessoires HomeKit natifs ;
- conserver les préférences utilisateur ;
- proposer une interface d'administration simple ;
- offrir une architecture claire et facilement extensible.

---

# Technologies utilisées

Le projet repose sur les technologies suivantes :

| Technologie | Utilisation |
|-------------|-------------|
| TypeScript | Développement principal |
| Node.js | Environnement d'exécution |
| Homebridge API | Intégration HomeKit |
| Home Assistant WebSocket API | Communication avec Home Assistant |
| Vue 3 | Interface graphique |
| Vite | Construction de l'interface utilisateur |
| ESLint | Analyse statique du code |

---

# Structure du projet

```text
src/
│
├── accessories/
├── catalog/
├── config/
├── discovery/
├── entities/
├── events/
├── managers/
├── platform/
├── services/
├── ui/
└── utils/
```

Chaque dossier regroupe des composants ayant une responsabilité clairement identifiée.

---

# Principes de développement

Le projet suit plusieurs principes importants.

## Une classe = une responsabilité

Chaque classe doit rester spécialisée.

Évitez les classes qui :

- découvrent les appareils ;
- gèrent le catalogue ;
- publient HomeKit ;

simultanément.

---

## Préférer la composition

Lorsque cela est possible, privilégiez plusieurs petites classes collaborant entre elles plutôt qu'une classe unique très volumineuse.

Cette approche améliore :

- la lisibilité ;
- les tests ;
- la maintenance.

---

## Éviter les dépendances circulaires

Les composants doivent communiquer dans un seul sens.

Par exemple :

```text
Discovery
    ↓
CatalogManager
    ↓
RegistryManager
    ↓
AccessoryManager
```

Aucun composant ne doit remonter le pipeline.

---

# Pipeline de synchronisation

Toutes les données suivent le même parcours.

```text
Home Assistant

      │

      ▼

Discovery

      │

      ▼

ClimateDeviceBuilder

      │

      ▼

ClimateDeviceManager

      │

      ▼

CatalogManager

      │

      ▼

RegistryManager

      │

      ▼

AccessoryManager

      │

      ▼

ClimateAccessory
```

Ce pipeline constitue le cœur du plugin.

---

# Le catalogue

Le catalogue est la mémoire permanente du projet.

Il enregistre notamment :

- les appareils découverts ;
- les favoris ;
- les pièces ;
- les appareils publiés ;
- les appareils masqués ;
- la disponibilité ;
- la dernière communication.

Toute modification du catalogue est immédiatement sauvegardée.

---

# Cycle de vie d'un appareil

## Découverte

Home Assistant détecte un capteur.

↓

Discovery reçoit l'information.

↓

ClimateDeviceBuilder construit un objet métier.

↓

Le catalogue est synchronisé.

↓

L'accessoire HomeKit est créé si nécessaire.

---

## Mise à jour

Une nouvelle valeur est reçue.

↓

Le ClimateDevice est mis à jour.

↓

Le RegistryManager détecte les changements.

↓

Les caractéristiques HomeKit concernées sont mises à jour.

---

## Suppression

Si un appareil disparaît :

- il est marqué comme manquant ;
- ses préférences sont conservées ;
- il peut être restauré automatiquement lors de sa réapparition.

---

# Ajouter une nouvelle capacité

L'ajout d'une nouvelle capacité suit généralement les étapes suivantes.

## 1. Étendre le modèle métier

Ajouter la nouvelle propriété dans `ClimateDevice`.

---

## 2. Adapter le Builder

Le `ClimateDeviceBuilder` doit renseigner cette nouvelle propriété.

---

## 3. Adapter ClimateAccessory

Créer les caractéristiques HomeKit correspondantes.

---

## 4. Adapter le catalogue

Si cette nouvelle donnée doit être persistée, enrichir le modèle du catalogue.

---

## 5. Adapter l'interface utilisateur

Afficher cette nouvelle information dans les écrans concernés.

---

# Gestion des événements

Le plugin fonctionne principalement sur un modèle événementiel.

Les événements peuvent provenir :

- de Home Assistant ;
- de l'interface utilisateur ;
- de Homebridge.

Chaque événement est traité indépendamment.

---

# Gestion des erreurs

Les erreurs ne doivent jamais interrompre le fonctionnement du plugin.

Les principes appliqués sont les suivants :

- journaliser l'erreur ;
- poursuivre le traitement lorsque cela est possible ;
- préserver le catalogue ;
- éviter les redémarrages inutiles.

---

# Journalisation

Les messages de journal doivent être :

- explicites ;
- utiles ;
- suffisamment détaillés pour faciliter le diagnostic.

Les informations importantes sont notamment :

- découverte des appareils ;
- création d'accessoires ;
- restauration depuis le cache ;
- synchronisation ;
- erreurs de communication.

Les journaux de débogage temporaires doivent être supprimés avant toute publication.

---

# Interface utilisateur

L'interface d'administration est développée avec Vue 3.

Elle permet notamment :

- la consultation du catalogue ;
- la recherche ;
- le tri ;
- le filtrage ;
- la gestion des favoris ;
- la modification des préférences ;
- la consultation des détails d'un appareil.

Les mises à jour sont dynamiques et ne nécessitent pas de rechargement manuel.

---

# Conventions de codage

Le projet applique les conventions suivantes :

- TypeScript strict ;
- indentation de deux espaces ;
- guillemets simples ;
- point-virgule obligatoire ;
- noms explicites ;
- commentaires limités aux cas réellement utiles.

L'analyse statique est assurée par ESLint.

---

# Construction du projet

Compilation complète :

```bash
npm run build:all
```

Compilation du plugin :

```bash
npm run build
```

Compilation de l'interface utilisateur :

```bash
npm run build:ui
```

Analyse statique :

```bash
npm run lint
```

---

# Publication

Avant toute publication :

- vérifier que le projet compile sans erreur ;
- vérifier que l'analyse ESLint est correcte ;
- tester le plugin sur Homebridge ;
- vérifier l'interface utilisateur ;
- mettre à jour le CHANGELOG ;
- incrémenter le numéro de version.

Une fois ces vérifications effectuées :

```bash
npm publish
```

---

# Bonnes pratiques

Avant de proposer une évolution :

- conserver une responsabilité unique par composant ;
- limiter les dépendances ;
- préserver la compatibilité HomeKit ;
- maintenir la cohérence du catalogue ;
- documenter les nouvelles fonctionnalités.

---

# Philosophie du projet

Le projet privilégie toujours :

- la simplicité ;
- la robustesse ;
- la lisibilité ;
- la stabilité ;
- la compatibilité avec Homebridge et Home Assistant.

Chaque évolution doit renforcer ces principes sans complexifier inutilement l'architecture.
