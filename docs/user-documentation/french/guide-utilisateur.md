# Guide utilisateur

Bienvenue dans **Homebridge HA Virtual Devices**.

Ce guide explique comment installer, configurer et utiliser le plugin afin d'exposer facilement des capteurs Home Assistant dans **Apple Home**.

Aucune connaissance en développement n'est nécessaire.

---

# Présentation

Homebridge HA Virtual Devices permet de publier automatiquement certains capteurs Home Assistant sous forme d'accessoires HomeKit natifs.

Le plugin a été conçu pour :

- simplifier l'intégration dans Apple Home ;
- éviter la création manuelle d'accessoires virtuels ;
- conserver les préférences utilisateur ;
- offrir une interface graphique simple d'utilisation.

---

# Fonctionnalités principales

Le plugin propose notamment :

- découverte automatique des capteurs compatibles ;
- publication automatique dans Apple Home ;
- gestion des favoris ;
- activation ou désactivation des appareils ;
- masquage d'appareils ;
- gestion des pièces ;
- suivi de la disponibilité ;
- mémorisation des préférences ;
- synchronisation dynamique sans redémarrage dans la plupart des cas.

---

# Installation

## Prérequis

Avant d'installer le plugin, vous devez disposer de :

- Homebridge installé et fonctionnel ;
- Home Assistant accessible sur le réseau ;
- une connexion WebSocket fonctionnelle avec Home Assistant.

---

## Installation depuis Homebridge

1. Ouvrez l'interface Homebridge.
2. Accédez au menu **Plugins**.
3. Recherchez :

```
homebridge-ha-virtual-devices
```

4. Cliquez sur **Installer**.

---

## Installation via npm

```bash
npm install -g homebridge-ha-virtual-devices
```

---

# Première configuration

Après installation :

1. ouvrez les paramètres du plugin ;
2. renseignez les informations de connexion à Home Assistant ;
3. enregistrez la configuration ;
4. redémarrez Homebridge si nécessaire.

Au premier démarrage, le plugin découvre automatiquement les appareils compatibles.

---

# Découverte automatique

Le plugin recherche les capteurs compatibles dans Home Assistant.

Aucune déclaration manuelle n'est nécessaire.

Chaque appareil découvert est ajouté au catalogue interne.

---

# Le catalogue

Le catalogue centralise tous les appareils connus.

Pour chaque appareil, il est possible de :

- l'activer ;
- le désactiver ;
- le masquer ;
- l'ajouter aux favoris ;
- modifier sa pièce ;
- consulter ses informations détaillées.

Toutes ces modifications sont automatiquement enregistrées.

---

# Les favoris

Les favoris permettent de retrouver rapidement les appareils les plus importants.

Pour ajouter un favori :

1. ouvrez le catalogue ;
2. cliquez sur l'icône ★.

Le changement est enregistré immédiatement.

---

# Les pièces

Vous pouvez modifier la pièce associée à un appareil.

Cette information est conservée dans le catalogue et réutilisée lors des synchronisations suivantes.

---

# États des appareils

Chaque appareil peut être dans l'un des états suivants.

## Actif

L'appareil est publié dans Apple Home.

---

## Désactivé

L'appareil reste connu du plugin mais n'est plus publié.

---

## Masqué

L'appareil est volontairement caché dans le catalogue afin de simplifier l'affichage.

---

## Manquant

Le plugin ne retrouve plus l'appareil dans Home Assistant.

Ses préférences restent néanmoins conservées.

---

# Disponibilité

Le plugin surveille en permanence la disponibilité des capteurs.

Lorsqu'un appareil devient indisponible :

- il n'est pas supprimé ;
- son historique est conservé ;
- Apple Home est informé de son indisponibilité lorsque cela est possible.

Lorsque le capteur réapparaît, il est automatiquement réactivé.

---

# Dernière communication

Chaque appareil possède une information **Dernière communication**.

Cette date correspond à la dernière mise à jour reçue depuis Home Assistant.

Elle permet notamment de détecter :

- un capteur bloqué ;
- une batterie déchargée ;
- un problème de communication.

---

# Interface d'administration

L'interface graphique permet :

- de rechercher un appareil ;
- de filtrer les appareils ;
- de trier les résultats ;
- de consulter les détails ;
- de modifier les préférences.

Toutes les modifications sont prises en compte immédiatement.

---

# Recherche

Le champ de recherche permet de retrouver rapidement un appareil par son nom.

La liste est filtrée au fur et à mesure de la saisie.

---

# Tri

Le catalogue peut être trié selon plusieurs critères.

Par exemple :

- nom ;
- pièce ;
- état ;
- favori.

Le sens du tri peut être inversé.

---

# Détails d'un appareil

Le panneau de détails affiche notamment :

- le nom ;
- l'identifiant ;
- la pièce ;
- l'état ;
- les capacités disponibles ;
- la disponibilité ;
- la dernière communication.

---

# Synchronisation

Le plugin synchronise automatiquement :

- les nouveaux appareils ;
- les suppressions ;
- les modifications de préférences ;
- les changements d'état.

Dans la majorité des cas, aucun redémarrage n'est nécessaire.

---

# Mise à jour du plugin

Pour mettre le plugin à jour :

1. installez la nouvelle version ;
2. redémarrez Homebridge si nécessaire.

Le catalogue est automatiquement conservé.

Vous ne perdez ni :

- vos favoris ;
- vos pièces ;
- vos préférences ;
- vos appareils publiés.

---

# Conseils d'utilisation

Il est recommandé de :

- vérifier régulièrement la disponibilité des capteurs ;
- conserver uniquement les appareils réellement utiles ;
- utiliser les favoris pour accéder rapidement aux capteurs importants ;
- masquer les appareils rarement consultés.

---

# Bonnes pratiques

Pour obtenir les meilleures performances :

- maintenez Homebridge à jour ;
- maintenez Home Assistant à jour ;
- surveillez les journaux du plugin en cas de problème ;
- vérifiez régulièrement l'état des batteries des capteurs.

---

# Assistance

En cas de difficulté :

1. consultez les journaux Homebridge ;
2. vérifiez la connexion avec Home Assistant ;
3. consultez le document **Troubleshooting** ;
4. ouvrez une issue sur GitHub si le problème persiste.

---

# Conclusion

Homebridge HA Virtual Devices a été conçu pour offrir une intégration simple, fiable et durable entre Home Assistant et Apple Home.

Grâce à la découverte automatique, au catalogue persistant et à la synchronisation dynamique, la gestion des capteurs devient largement transparente pour l'utilisateur.