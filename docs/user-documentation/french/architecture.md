# Architecture

Ce document décrit l'architecture interne de **Homebridge HA Virtual Devices**.

Il s'adresse aux développeurs souhaitant comprendre le fonctionnement du plugin, contribuer à son évolution ou simplement découvrir les choix techniques qui ont guidé sa conception.

Le présent document complète le **Guide développeur** et le **Guide utilisateur**. Il se concentre exclusivement sur l'organisation interne du plugin.

---

# Vue d'ensemble

Le plugin agit comme une passerelle intelligente entre **Home Assistant** et **Apple Home**.

Il découvre automatiquement les capteurs présents dans Home Assistant, construit un modèle interne cohérent, maintient un catalogue persistant puis expose uniquement les appareils souhaités dans HomeKit.

L'architecture repose sur plusieurs couches indépendantes afin de garantir :

- une maintenance facilitée ;
- une grande évolutivité ;
- une excellente stabilité ;
- une synchronisation efficace.

---

# Principes d'architecture

Le développement du plugin suit quelques règles simples.

## Une responsabilité unique

Chaque composant possède une responsabilité clairement définie.

Par exemple :

- la découverte ne publie jamais d'accessoires HomeKit ;
- les accessoires HomeKit ne dialoguent jamais directement avec Home Assistant ;
- le catalogue ne gère jamais l'interface HomeKit.

Cette séparation limite fortement les dépendances.

---

## Une architecture modulaire

Chaque fonctionnalité importante est isolée dans son propre composant.

Ainsi, une évolution d'un module a très peu d'impact sur les autres parties du projet.

---

## Une synchronisation centralisée

Toutes les modifications passent par un pipeline unique.

Aucun composant ne modifie directement un accessoire HomeKit sans passer par le gestionnaire de synchronisation.

Cette règle garantit la cohérence de l'ensemble.

---

## Une persistance complète

Le plugin mémorise toutes les préférences utilisateur.

Un redémarrage de Homebridge ne doit jamais entraîner :

- la perte des favoris ;
- la perte des pièces ;
- la perte des appareils publiés ;
- la perte de l'historique.

---

# Architecture générale

```text
                     Home Assistant
                            │
                            ▼
                    WebSocket API
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
             Catalogue persistant (JSON)
                            │
                            ▼
                   RegistryManager
                            │
                            ▼
                  AccessoryManager
                            │
                            ▼
                  ClimateAccessory
                            │
                            ▼
                        Apple Home
```

Chaque couche ne connaît que la couche voisine.

Cette architecture limite les couplages entre composants.

---

# Description des composants

## Discovery

Le composant **Discovery** communique avec Home Assistant.

Il est chargé de :

- récupérer les appareils disponibles ;
- écouter les événements WebSocket ;
- détecter les nouveaux capteurs ;
- détecter les suppressions ;
- transmettre les changements d'état.

Discovery ne crée jamais directement d'accessoire HomeKit.

---

## ClimateDeviceBuilder

Ce composant transforme les données brutes provenant de Home Assistant en objets métier.

Il :

- regroupe les différentes entités d'un même appareil ;
- détecte les capacités disponibles ;
- extrait les métadonnées utiles ;
- uniformise les données reçues.

Le résultat est un objet `ClimateDevice`.

---

## ClimateDeviceManager

Le **ClimateDeviceManager** gère l'ensemble des objets `ClimateDevice`.

Ses responsabilités sont :

- créer les objets métier ;
- maintenir leur cohérence ;
- fournir les appareils aux autres composants ;
- suivre leur état courant.

Il ne connaît pas HomeKit.

---

## CatalogManager

Le **CatalogManager** constitue la mémoire permanente du plugin.

Il synchronise :

- les appareils découverts ;
- les préférences utilisateur ;
- le fichier de catalogue.

Il assure notamment :

- le chargement du catalogue ;
- la sauvegarde automatique ;
- la conservation des favoris ;
- la gestion des pièces ;
- le suivi des appareils masqués ;
- les dates de découverte ;
- la disponibilité ;
- la dernière communication.

---

## Catalogue persistant

Le catalogue est enregistré dans un fichier JSON.

Chaque appareil contient notamment :

- son identifiant ;
- son nom ;
- sa pièce ;
- son état ;
- son statut de favori ;
- son statut masqué ;
- sa disponibilité ;
- sa date de découverte ;
- sa dernière mise à jour ;
- sa dernière communication.

Toutes ces informations sont restaurées automatiquement au démarrage.

---

## RegistryManager

Le **RegistryManager** orchestre la synchronisation entre :

- les appareils découverts ;
- le catalogue ;
- les accessoires Homebridge.

Depuis la version **1.0.9**, il compare systématiquement l'ancien état et le nouvel état avant de lancer une synchronisation.

Cela évite de nombreuses opérations inutiles.

---

## AccessoryManager

L'AccessoryManager est responsable du cycle de vie des accessoires Homebridge.

Il :

- crée les accessoires ;
- restaure ceux présents dans le cache ;
- met à jour leurs informations ;
- supprime ceux devenus inutiles.

Il constitue l'unique point d'accès aux API Homebridge.

---

## ClimateAccessory

Chaque appareil publié est représenté par une instance de `ClimateAccessory`.

Cette classe gère :

- la température ;
- l'humidité ;
- la batterie ;
- la disponibilité ;
- les informations d'identification HomeKit.

Elle ne contient aucune logique métier liée à Home Assistant.

---

# Flux de synchronisation

Chaque modification suit le même chemin.

```text
Événement Home Assistant

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

        │

        ▼

Apple Home
```

Ce pipeline garantit que toutes les données sont validées avant d'être publiées.

---

# Synchronisation dynamique

À partir de la version **1.0.9**, la synchronisation est devenue entièrement dynamique.

Auparavant, certaines modifications nécessitaient un redémarrage de Homebridge.

Aujourd'hui :

- une modification de favori ;
- un changement de pièce ;
- une publication ;
- un masquage ;
- une désactivation ;

peuvent être appliqués immédiatement après leur enregistrement.

Le RegistryManager identifie uniquement les accessoires réellement concernés.

---

# Gestion de la disponibilité

Le plugin distingue clairement plusieurs états.

## Disponible

Le capteur répond normalement.

Toutes les caractéristiques HomeKit sont mises à jour.

---

## Indisponible

Le capteur existe toujours mais ne répond plus.

Les caractéristiques concernées sont marquées comme indisponibles dans HomeKit tout en conservant l'accessoire.

---

## Manquant

Le capteur n'est plus découvert dans Home Assistant.

Le catalogue conserve néanmoins :

- les préférences utilisateur ;
- les favoris ;
- les informations historiques.

Si le capteur réapparaît, il est restauré automatiquement.

---

# Persistance

Le catalogue permet notamment de conserver :

- les favoris ;
- les pièces ;
- l'état de publication ;
- l'état masqué ;
- les dates importantes ;
- la dernière communication.

Ainsi, un redémarrage n'entraîne aucune perte de configuration.

---

# Extensibilité

L'architecture facilite l'ajout de nouveaux types de capteurs.

Dans la majorité des cas, il suffit de :

1. enrichir le `ClimateDeviceBuilder` ;
2. compléter `ClimateAccessory` ;
3. étendre éventuellement le catalogue.

Le reste de l'architecture demeure inchangé.

---

# Séparation des responsabilités

Le plugin distingue clairement :

| Composant | Responsabilité |
|-----------|----------------|
| Discovery | Communication avec Home Assistant |
| ClimateDeviceBuilder | Construction des objets métier |
| ClimateDeviceManager | Gestion des appareils |
| CatalogManager | Persistance et préférences |
| RegistryManager | Synchronisation |
| AccessoryManager | Gestion des accessoires Homebridge |
| ClimateAccessory | Représentation HomeKit |

Cette séparation constitue l'un des principaux atouts du projet.

---

# Évolutions futures

L'architecture actuelle a été pensée pour permettre l'intégration de nouveaux types d'appareils sans remettre en cause les fondations existantes.

Les évolutions envisagées comprennent notamment :

- la prise en charge de nouveaux capteurs environnementaux ;
- l'enrichissement des métadonnées du catalogue ;
- des statistiques de synchronisation ;
- des outils avancés de diagnostic ;
- des mécanismes de supervision plus complets.

L'objectif reste inchangé : conserver une architecture simple, modulaire, robuste et facile à maintenir sur le long terme.