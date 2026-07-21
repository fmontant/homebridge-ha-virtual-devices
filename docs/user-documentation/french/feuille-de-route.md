# Feuille de route

Cette feuille de route présente les orientations envisagées pour **Homebridge HA Virtual Devices**.

Elle ne constitue pas un engagement contractuel mais une vision des évolutions possibles du projet.

Les priorités pourront évoluer en fonction :

- des retours des utilisateurs ;
- des évolutions de Homebridge ;
- des évolutions de Home Assistant ;
- des possibilités offertes par HomeKit.

---

# Vision

L'objectif du projet est de proposer une passerelle de référence entre **Home Assistant** et **Apple Home** pour les capteurs environnementaux.

Les principes fondateurs resteront inchangés :

- simplicité d'utilisation ;
- stabilité ;
- performances ;
- compatibilité maximale avec HomeKit ;
- maintenance facilitée.

---

# Version 1.x

La branche 1.x a pour objectif de consolider les fondations du projet.

Les développements concernent principalement :

- l'amélioration de la stabilité ;
- l'optimisation des performances ;
- l'enrichissement de l'interface utilisateur ;
- l'amélioration de la documentation.

---

# Interface utilisateur

Plusieurs évolutions sont envisagées.

## Tableau de bord

Afficher des informations globales telles que :

- nombre d'appareils découverts ;
- appareils actifs ;
- appareils désactivés ;
- appareils masqués ;
- appareils manquants ;
- favoris.

---

## Statistiques

Ajouter des indicateurs tels que :

- nombre de synchronisations ;
- dernière synchronisation ;
- durée moyenne des synchronisations ;
- nombre d'événements traités.

---

## Recherche avancée

Étendre les possibilités de recherche :

- recherche multicritère ;
- filtres combinés ;
- recherches enregistrées.

---

## Tri personnalisable

Permettre :

- plusieurs niveaux de tri ;
- mémorisation des préférences ;
- ordre personnalisé.

---

# Catalogue

Le catalogue constitue l'un des éléments clés du plugin.

Les évolutions possibles incluent :

- ajout de nouvelles métadonnées ;
- historique des modifications ;
- export du catalogue ;
- import du catalogue ;
- sauvegarde automatique.

---

# Synchronisation

Les optimisations envisagées concernent :

- réduction des traitements inutiles ;
- meilleure détection des modifications ;
- synchronisations partielles encore plus rapides ;
- amélioration de la journalisation.

---

# Compatibilité Home Assistant

Le plugin continuera à suivre les évolutions de Home Assistant.

Les objectifs sont :

- maintenir la compatibilité avec les nouvelles versions ;
- prendre en charge de nouveaux types d'entités lorsque cela est pertinent ;
- exploiter les nouvelles possibilités offertes par l'API WebSocket.

---

# Compatibilité HomeKit

Le projet privilégiera toujours les services HomeKit officiels.

Les évolutions futures viseront à :

- améliorer l'intégration avec Apple Home ;
- exploiter les nouvelles caractéristiques HomeKit lorsqu'elles seront disponibles ;
- conserver une compatibilité maximale avec les différentes versions d'iOS, iPadOS et macOS.

---

# Nouveaux types de capteurs

À moyen terme, le projet pourra être étendu à d'autres familles de capteurs compatibles avec Home Assistant.

Chaque nouveau type sera intégré uniquement s'il apporte une réelle valeur ajoutée et s'intègre naturellement à l'architecture existante.

---

# Diagnostic

Les outils de diagnostic pourront être enrichis avec :

- un état de santé global du plugin ;
- des informations détaillées sur les synchronisations ;
- des indicateurs de communication avec Home Assistant ;
- des statistiques de disponibilité des appareils.

---

# Journalisation

Des améliorations sont envisagées concernant :

- le niveau de détail des journaux ;
- les filtres de journalisation ;
- les diagnostics avancés ;
- les rapports d'erreurs.

---

# Documentation

La documentation continuera d'évoluer afin de rester en phase avec le projet.

Les objectifs sont :

- maintenir une documentation bilingue (anglais et français) ;
- illustrer les fonctionnalités par des captures d'écran ;
- enrichir les schémas d'architecture ;
- documenter les nouvelles fonctionnalités dès leur intégration.

---

# Qualité du code

Le projet poursuivra ses efforts en matière de qualité :

- amélioration continue de l'architecture ;
- réduction de la complexité ;
- renforcement des contrôles ESLint ;
- homogénéisation du style de code ;
- simplification des composants lorsque cela est possible.

---

# Tests

Les développements futurs pourront intégrer progressivement :

- des tests unitaires ;
- des tests d'intégration ;
- des scénarios de validation automatisés.

L'objectif est d'améliorer encore la fiabilité du projet tout en facilitant les évolutions.

---

# Communauté

Les retours des utilisateurs constituent une source importante d'amélioration.

Les contributions sont les bienvenues, notamment pour :

- signaler des anomalies ;
- proposer de nouvelles fonctionnalités ;
- améliorer la documentation ;
- partager des retours d'expérience.

---

# Priorités

Les priorités actuelles peuvent être résumées ainsi :

## Priorité élevée

- stabilité ;
- performances ;
- compatibilité Homebridge ;
- compatibilité Home Assistant ;
- amélioration continue de l'interface utilisateur.

---

## Priorité moyenne

- enrichissement des outils de diagnostic ;
- nouvelles options de personnalisation ;
- amélioration des statistiques.

---

## Priorité à long terme

- prise en charge de nouveaux types d'appareils ;
- nouveaux outils d'administration ;
- automatisation des tests.

---

# Conclusion

Homebridge HA Virtual Devices est un projet conçu pour évoluer dans la durée.

Chaque nouvelle fonctionnalité devra respecter les principes qui ont guidé son développement depuis l'origine :

- simplicité ;
- modularité ;
- robustesse ;
- compatibilité ;
- qualité.

L'objectif reste de proposer une intégration toujours plus fluide entre Home Assistant et Apple Home, tout en conservant une architecture claire, performante et facile à maintenir.
