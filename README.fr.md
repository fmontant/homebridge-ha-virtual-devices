# Homebridge HA Virtual Devices

> Expose les capteurs environnementaux de Home Assistant sous forme d'accessoires HomeKit natifs via Homebridge.

[![Build](https://github.com/fmontant/homebridge-ha-virtual-devices/actions/workflows/build.yml/badge.svg)](https://github.com/fmontant/homebridge-ha-virtual-devices/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/homebridge-ha-virtual-devices.svg)](https://www.npmjs.com/package/homebridge-ha-virtual-devices)
[![Homebridge](https://img.shields.io/badge/Homebridge-2.x-orange)](https://homebridge.io/)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Compatible-blue)](https://www.home-assistant.io/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)
[![Licence](https://img.shields.io/github/license/fmontant/homebridge-ha-virtual-devices)](LICENSE)

---

## Présentation

Home Assistant est une plateforme particulièrement puissante pour collecter les données provenant des objets connectés.

Apple Home propose une interface simple et cohérente pour consulter et utiliser ces informations au quotidien.

**Homebridge HA Virtual Devices** relie ces deux écosystèmes.

Le plugin découvre automatiquement les capteurs environnementaux compatibles dans Home Assistant et les expose sous forme d'accessoires HomeKit entièrement natifs.

L'objectif n'est pas d'ajouter davantage de tuiles dans Apple Home.

L'objectif est de proposer une expérience plus simple, plus lisible et plus cohérente.

Au lieu d'afficher séparément :

- la température ;
- l'humidité ;
- le niveau de batterie ;

les informations associées à un même appareil sont regroupées dans une seule tuile HomeKit.

Le résultat :

- une interface Apple Home plus claire ;
- moins d'accessoires à gérer ;
- davantage d'informations au même endroit ;
- une expérience réellement native.

Aucun polling.

Aucun service HomeKit personnalisé.

Aucune configuration manuelle complexe.

Uniquement des accessoires HomeKit standards.

---

## Pourquoi ce plugin ?

Apple Home ne propose pas actuellement de type d'accessoire spécifiquement dédié aux capteurs environnementaux.

Une sonde équipée de plusieurs mesures apparaît généralement sous plusieurs accessoires indépendants :

- Température ;
- Humidité ;
- Batterie.

Avec un grand nombre de capteurs, cette organisation devient rapidement difficile à exploiter.

Après analyse des services HomeKit disponibles, le thermostat s'est révélé être le meilleur compromis.

Une seule tuile permet d'afficher naturellement :

- la température actuelle ;
- l'humidité relative ;
- les informations de l'accessoire ;
- le niveau de batterie lorsqu'il est disponible.

Le plugin utilise uniquement les capacités natives de HomeKit.

L'objectif est simple :

> Utiliser les services HomeKit existants pour offrir une intégration fiable, propre et naturelle dans Apple Home.

---

## Fonctionnalités

### Découverte automatique

Les appareils compatibles sont automatiquement découverts depuis Home Assistant.

Aucune déclaration manuelle n'est nécessaire.

Le plugin identifie les capteurs environnementaux disponibles et crée automatiquement les accessoires HomeKit correspondants.

---

### Regroupement intelligent

Les différentes informations provenant d'un même appareil sont regroupées automatiquement.

Au lieu d'obtenir plusieurs accessoires indépendants :

- Température ;
- Humidité ;
- Batterie ;

Apple Home affiche une seule tuile contenant toutes les informations disponibles.

Cette approche permet de conserver une interface claire et facile à utiliser.

---

### Accessoires HomeKit natifs

Le plugin utilise exclusivement les services HomeKit officiels.

Il n'utilise pas :

- de services HomeKit personnalisés ;
- de caractéristiques propriétaires ;
- de solutions de contournement.

L'objectif est de garantir la meilleure compatibilité possible avec l'écosystème Apple.

---

### Synchronisation temps réel

Le plugin communique avec Home Assistant grâce à son API WebSocket.

Les changements détectés sont immédiatement répercutés dans Apple Home.

Aucun polling n'est utilisé.

Cette approche permet :

- des mises à jour plus rapides ;
- une consommation réduite des ressources ;
- une meilleure fiabilité de synchronisation.

---

### Informations enrichies

Lorsque ces informations sont disponibles, les accessoires peuvent exposer :

- le fabricant ;
- le modèle ;
- la version du firmware ;
- la version matérielle ;
- le numéro de série ;
- le niveau de batterie.

---

### Catalogue persistant

Le plugin maintient un catalogue persistant des appareils découverts.

Contrairement à un fonctionnement classique où un appareil temporairement indisponible peut disparaître définitivement, le catalogue conserve les informations connues.

Chaque appareil peut conserver :

- son identifiant unique ;
- son nom affiché ;
- sa pièce ;
- son état de publication ;
- son statut favori ;
- son état masqué ;
- sa disponibilité ;
- sa date de découverte ;
- sa dernière communication ;
- son état de synchronisation.

Les préférences utilisateur sont conservées après :

- un redémarrage de Homebridge ;
- un redémarrage de Home Assistant ;
- une mise à jour du plugin.

L'architecture détaillée du catalogue est disponible dans :

```
docs/developer-documentation/architecture/
```

---

### Synchronisation dynamique

Les préférences modifiées depuis l'interface Homebridge sont automatiquement synchronisées.

Lorsqu'une modification est effectuée :

- le catalogue est mis à jour ;
- l'accessoire concerné est synchronisé ;
- HomeKit est automatiquement actualisé.

Exemple :

- Modifier une préférence dans Homebridge UI ;
- Mettre à jour le catalogue persistant ;
- Synchroniser l'accessoire concerné ;
- Mettre à jour Apple Home.

Aucun redémarrage de Homebridge n'est nécessaire.

---

## Interface Homebridge

Le plugin dispose d'une interface d'administration intégrée permettant de gérer les appareils découverts.

Elle constitue le centre de pilotage des appareils virtuels exposés dans HomeKit.

Elle permet notamment de :

- rechercher un appareil ;
- filtrer par pièce ;
- trier les équipements ;
- gérer les favoris ;
- modifier les préférences ;
- activer ou désactiver la publication dans HomeKit ;
- masquer un appareil ;
- consulter les informations détaillées ;
- suivre la disponibilité ;
- connaître la dernière communication.

---

### Gestion des indisponibilités

Les capteurs environnementaux peuvent temporairement devenir indisponibles pour différentes raisons :

- remplacement des piles ;
- perte temporaire de communication Zigbee ;
- redémarrage du coordinateur ;
- redémarrage de Home Assistant ;
- interruption réseau.

Le plugin détecte automatiquement ces situations.

Lorsque Home Assistant indique qu'un appareil n'est plus disponible :

- l'état de disponibilité est mis à jour ;
- HomeKit reflète l'état de communication lorsque cela est possible ;
- les informations connues de l'appareil sont conservées.

Lorsque le capteur redevient disponible :

- les valeurs sont actualisées ;
- l'accessoire reprend son fonctionnement normal ;
- aucune intervention utilisateur n'est nécessaire.

---

## Prérequis

### Homebridge

- Homebridge 2.x

### Node.js

- Node.js 22 ou version supérieure

### Home Assistant

Une instance Home Assistant fonctionnelle est nécessaire avec :

- l'API WebSocket activée ;
- un jeton d'accès longue durée (*Long-Lived Access Token*) ;
- une connectivité réseau entre Homebridge et Home Assistant.

---

## Installation

Le plugin peut être installé directement depuis le gestionnaire de plugins Homebridge ou avec npm.

```bash
npm install -g homebridge-ha-virtual-devices
```

Après installation, redémarrez Homebridge.

---

## Configuration

La configuration est volontairement limitée au strict nécessaire.

Exemple :

```json
{
  "platform": "HomeAssistantVirtualDevices",
  "name": "Home Assistant Virtual Devices",
  "host": "http://homeassistant.local:8123",
  "token": "YOUR_LONG_LIVED_ACCESS_TOKEN"
}
```

### Paramètres disponibles

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| host | Oui | URL de Home Assistant |
| token | Oui | Jeton d'accès longue durée |
| includeHumidity | Non | Publier l'humidité lorsqu'elle est disponible |
| includeBattery | Non | Publier le niveau de batterie lorsqu'il est disponible |
| logLevel | Non | Niveau de journalisation |

---

## Documentation

La documentation complète est disponible dans le dossier `docs`.

Elle est organisée en deux parties.

---

### Documentation utilisateur

Documentation destinée aux utilisateurs du plugin.

Elle contient :

- guide d'installation ;
- configuration ;
- guide utilisateur ;
- dépannage ;
- questions fréquentes.

Disponible en :

- français ;
- anglais.

Emplacement :

```
docs/user-documentation/french/
```

---

### Documentation développeur

Documentation technique destinée aux contributeurs et développeurs.

Elle contient :

- architecture du plugin ;
- composants internes ;
- Architecture Decision Records ;
- diagrammes techniques.

Emplacement :

```
docs/developer-documentation/
```

---

## Philosophie du projet

Le développement de **Homebridge HA Virtual Devices** repose sur quelques principes simples.

### HomeKit avant tout

Le plugin privilégie les services HomeKit natifs.

L'objectif est de proposer une intégration qui s'intègre naturellement dans Apple Home sans utiliser de solutions propriétaires.

---

### Simplicité

Le minimum de configuration est recherché.

La découverte automatique est toujours privilégiée par rapport à une configuration manuelle complexe.

---

### Fiabilité

Une perte temporaire de communication ne doit jamais obliger l'utilisateur à recréer ses accessoires.

Les appareils connus restent suivis grâce au catalogue persistant.

---

### Maintenabilité

Chaque composant possède une responsabilité clairement définie.

Cette organisation permet de faire évoluer le projet tout en conservant une architecture stable.

---

## Questions fréquentes

### Le plugin modifie-t-il Home Assistant ?

Non.

Le plugin fonctionne uniquement en lecture.

Il :

- découvre les entités compatibles ;
- écoute les événements Home Assistant ;
- met à jour les accessoires HomeKit.

Il ne crée, ne modifie et ne supprime aucune entité dans Home Assistant.

---

### Le plugin utilise-t-il du polling ?

Non.

Les communications reposent sur l'API WebSocket de Home Assistant.

Les mises à jour sont déclenchées par les événements.

Cette approche réduit la charge système tout en permettant une synchronisation rapide.

---

### Que se passe-t-il si Home Assistant redémarre ?

Le plugin se reconnecte automatiquement.

Lorsque Home Assistant redevient disponible :

- les appareils sont redécouverts ;
- les valeurs sont actualisées ;
- HomeKit est mis à jour.

Aucune intervention n'est nécessaire.

---

### Que se passe-t-il si un capteur disparaît temporairement ?

Le catalogue conserve les informations de l'appareil.

Lorsque la communication est interrompue :

- la disponibilité est mise à jour ;
- les préférences utilisateur sont conservées ;
- l'accessoire reste connu.

Lorsque le capteur revient en ligne, son fonctionnement normal reprend automatiquement.

---

### Mes préférences sont-elles conservées après une mise à jour ?

Oui.

Le catalogue persistant conserve notamment :

- les favoris ;
- les pièces ;
- l'état de publication ;
- les appareils masqués ;
- l'historique de découverte.

---

## Feuille de route

Les évolutions envisagées comprennent :

### Interface utilisateur

- filtres avancés ;
- opérations par lot ;
- statistiques des appareils ;
- tableau de bord de santé ;
- enrichissement des informations du catalogue.

---

### Nouveaux capteurs

Le support pourra être étendu à :

- qualité de l'air ;
- CO₂ ;
- composés organiques volatils (VOC) ;
- pression atmosphérique ;
- luminosité ;
- autres capteurs environnementaux compatibles Home Assistant.

---

### Évolutions HomeKit

Les pistes étudiées comprennent :

- enrichissement des métadonnées ;
- informations de diagnostic supplémentaires ;
- amélioration des rapports de synchronisation.

---

## Contribuer

Les contributions sont les bienvenues.

Vous pouvez aider en :

- signalant des bugs ;
- proposant des améliorations ;
- améliorant la documentation ;
- contribuant au code ;
- proposant des traductions.

Pour les évolutions importantes, il est recommandé d'ouvrir d'abord une discussion afin de valider l'approche.

---

## Support

Lors d'un signalement de problème, merci d'indiquer :

- version de Homebridge ;
- version de Node.js ;
- version de Home Assistant ;
- version du plugin ;
- journaux concernés ;
- étapes permettant de reproduire le problème.

Ces informations facilitent l'analyse et la résolution des problèmes.

---

## Licence

Licence MIT.

Voir le fichier **LICENSE** pour le texte complet.

---

## Remerciements

Merci à :

- la communauté Homebridge ;
- la communauté Home Assistant ;
- toutes les personnes ayant testé les différentes versions ;
- tous les utilisateurs ayant signalé des anomalies ou proposé des améliorations.

Leurs retours contribuent directement à l'évolution du projet.
