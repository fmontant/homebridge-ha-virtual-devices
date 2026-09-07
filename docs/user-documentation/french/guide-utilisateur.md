# Guide utilisateur

Bienvenue dans **Homebridge HA Virtual Devices**.

Ce guide explique comment installer, configurer et utiliser la version 2
du plugin avec **Home Assistant**, **Matter**, ou les deux
simultanément, afin de publier des capteurs compatibles dans **Apple
Home**.

Aucune connaissance en développement n'est nécessaire.

------------------------------------------------------------------------

## Présentation

Homebridge HA Virtual Devices transforme les données de capteurs
compatibles en accessoires HomeKit adaptés à l'affichage dans Apple
Home.

La version 2 peut utiliser deux sources indépendantes :

-   **Home Assistant**, via son API et sa connexion WebSocket ;
-   **Matter**, en intégrant directement au plugin un appareil Matter
    compatible.

Les deux sources peuvent être activées simultanément. Les appareils
découverts alimentent le même catalogue du plugin.

Le plugin a été conçu pour :

-   simplifier l'intégration des capteurs dans Apple Home ;
-   éviter la création manuelle d'accessoires virtuels ;
-   conserver les préférences utilisateur ;
-   fournir une interface graphique simple ;
-   permettre d'utiliser Matter sans imposer Home Assistant.

------------------------------------------------------------------------

## Fonctionnalités principales

Le plugin propose notamment :

-   choix de la source Home Assistant, Matter, ou des deux ;
-   découverte automatique des capteurs compatibles Home Assistant ;
-   ajout de capteurs Matter depuis l'interface du plugin ;
-   publication sous forme d'accessoires HomeKit ;
-   gestion des favoris ;
-   activation ou désactivation des appareils ;
-   masquage des appareils ;
-   nom personnalisé persistant ;
-   gestion d'une pièce interne au catalogue ;
-   suivi de la disponibilité et de la dernière communication ;
-   mémorisation des préférences ;
-   synchronisation dynamique des valeurs.

------------------------------------------------------------------------

## Installation

### Prérequis

Vous devez disposer de :

-   Homebridge installé et fonctionnel ;
-   une version de Node.js compatible avec votre installation Homebridge
    ;
-   pour utiliser Home Assistant : un serveur Home Assistant accessible
    et un jeton d'accès longue durée ;
-   pour utiliser Matter : un capteur Matter compatible pouvant être
    placé en mode jumelage.

Home Assistant n'est pas obligatoire si vous utilisez uniquement Matter.

### Installation depuis Homebridge

1.  Ouvrez l'interface Homebridge.
2.  Accédez à **Plugins**.
3.  Recherchez `homebridge-ha-virtual-devices`.
4.  Cliquez sur **Installer**.

### Installation via npm

``` bash
npm install -g homebridge-ha-virtual-devices
```

------------------------------------------------------------------------

## Première configuration

Ouvrez les paramètres du plugin puis choisissez au moins une source :

-   **Utiliser Home Assistant** ;
-   **Utiliser Matter**.

Vous pouvez activer les deux.

Une configuration dans laquelle les deux sources sont désactivées n'est
pas valide.

### Home Assistant uniquement

Activez **Utiliser Home Assistant** et désactivez **Utiliser Matter**.

Renseignez :

-   l'adresse de Home Assistant ;
-   le jeton d'accès longue durée.

Enregistrez ensuite la configuration.

### Matter uniquement

Désactivez **Utiliser Home Assistant** et activez **Utiliser Matter**.

Les paramètres de connexion Home Assistant ne sont alors pas
nécessaires.

Le panneau **Ajouter un capteur Matter** devient disponible dans
l'interface.

### Home Assistant et Matter

Activez les deux options.

Le plugin utilise alors les deux providers et alimente son catalogue
avec les appareils provenant de Home Assistant et de Matter.

------------------------------------------------------------------------

## Ajouter un capteur Matter

Un capteur Matter déjà installé dans Apple Home peut être partagé avec
le plugin grâce au mode de jumelage Matter.

Dans l'app **Maison** :

1.  ouvrez les réglages du capteur à ajouter ;
2.  choisissez **Activer le mode jumelage** ;
3.  Maison génère un nouveau code de partage Matter ;
4.  copiez ce code.

Dans l'interface du plugin :

1.  vérifiez que **Utiliser Matter** est activé ;
2.  ouvrez **Ajouter un capteur Matter** ;
3.  saisissez le nouveau code de partage ;
4.  cliquez sur **Ajouter le capteur**.

Après un ajout réussi, le capteur apparaît dans la liste des appareils.
Vous pouvez ensuite le renommer pour l'identifier plus facilement.

> Le code utilisé ici est le nouveau code de partage généré lors de
> l'activation du mode jumelage, et non nécessairement le code imprimé à
> l'origine sur l'appareil.

------------------------------------------------------------------------

## Découverte Home Assistant

Lorsque Home Assistant est activé, le plugin recherche automatiquement
les capteurs compatibles.

Aucune déclaration individuelle des capteurs n'est nécessaire.

Chaque appareil découvert est ajouté au catalogue persistant.

Si Home Assistant est désactivé, le plugin ne tente pas de s'y
connecter.

------------------------------------------------------------------------

## Le catalogue commun

Le catalogue centralise les appareils connus du plugin, quelle que soit
leur source.

Pour chaque appareil, l'interface permet notamment de :

-   l'activer ou le désactiver ;
-   le masquer ;
-   l'ajouter aux favoris ;
-   modifier son nom lorsque cette fonction est disponible ;
-   gérer sa pièce interne au plugin ;
-   consulter sa source et ses informations détaillées.

Les préférences sont conservées entre les synchronisations et les
redémarrages.

### À propos des pièces

La pièce enregistrée dans le catalogue est une information interne au
plugin.

Elle ne déplace pas automatiquement l'accessoire dans une pièce de
l'application Apple Maison. L'affectation aux pièces HomeKit reste gérée
dans Maison.

------------------------------------------------------------------------

## Les favoris

Les favoris permettent de retrouver rapidement les appareils les plus
importants.

Pour ajouter ou retirer un favori, utilisez l'icône ★ dans le catalogue.

Le changement est enregistré dans le catalogue persistant.

------------------------------------------------------------------------

## États des appareils

### Actif

L'appareil est activé dans le plugin et peut être publié dans HomeKit.

### Désactivé

L'appareil reste connu du catalogue mais n'est plus publié comme
appareil actif.

### Masqué

L'appareil est volontairement caché dans l'interface afin de simplifier
l'affichage.

### Manquant

Le plugin connaissait l'appareil mais ne le retrouve plus lors de la
synchronisation de sa source.

Les préférences enregistrées sont conservées afin de permettre de
retrouver l'appareil s'il réapparaît.

------------------------------------------------------------------------

## Disponibilité

La disponibilité indique si la source fournit actuellement des
informations exploitables pour l'appareil.

Une indisponibilité ne provoque pas automatiquement la suppression de
l'appareil du catalogue.

Lorsqu'un capteur redevient disponible, ses nouvelles valeurs peuvent à
nouveau être synchronisées.

------------------------------------------------------------------------

## Dernière communication

L'information **Dernière communication** permet de connaître la dernière
activité enregistrée pour le capteur.

Une date ancienne peut aider à repérer :

-   un capteur qui ne communique plus ;
-   une batterie déchargée ;
-   une perte de connexion ;
-   un problème entre le plugin et la source du capteur.

L'interprétation dépend donc de la source utilisée : Home Assistant ou
Matter.

------------------------------------------------------------------------

## Interface d'administration

L'interface graphique permet notamment :

-   de choisir les sources utilisées ;
-   d'ajouter un capteur Matter ;
-   de rechercher un appareil ;
-   de filtrer le catalogue ;
-   de trier les résultats ;
-   de consulter les détails ;
-   de modifier les préférences.

Le panneau Matter n'est affiché que lorsque Matter est activé.

------------------------------------------------------------------------

## Recherche et tri

Le champ de recherche permet de retrouver rapidement un appareil.

Le catalogue peut également être trié selon les critères proposés par
l'interface, par exemple le nom, la pièce, l'état ou les favoris.

------------------------------------------------------------------------

## Détails d'un appareil

Selon l'appareil et sa source, le panneau de détails peut présenter
notamment :

-   le nom ;
-   l'identifiant ;
-   la source ;
-   la pièce interne au plugin ;
-   l'état ;
-   les capacités disponibles ;
-   la disponibilité ;
-   la dernière communication.

------------------------------------------------------------------------

## Synchronisation

Le plugin reçoit les changements provenant de ses sources et met à jour
les appareils correspondants.

Avec Home Assistant, les changements sont reçus par la connexion
WebSocket.

Avec Matter, les appareils intégrés au provider Matter transmettent
leurs changements au plugin.

Les préférences du catalogue restent indépendantes de ces mises à jour
de valeurs.

------------------------------------------------------------------------

## Mise à niveau depuis la version 1.x

La version 2 introduit la sélection des sources.

Pour préserver le comportement historique, une ancienne configuration ne
contenant pas encore les nouveaux paramètres est interprétée comme suit
:

-   Home Assistant : **activé** ;
-   Matter : **désactivé**.

La migration ne nécessite donc pas de reconfigurer immédiatement une
installation Home Assistant existante.

------------------------------------------------------------------------

## Mise à jour du plugin

Lors d'une mise à jour :

1.  installez la nouvelle version ;
2.  redémarrez Homebridge si l'interface ou Homebridge le demande ;
3.  vérifiez les journaux en cas de comportement inhabituel.

Le catalogue persistant est conçu pour conserver les préférences
utilisateur.

------------------------------------------------------------------------

## Bonnes pratiques

Il est recommandé de :

-   n'activer que les sources réellement utilisées ;
-   conserver Homebridge et les composants associés à jour ;
-   surveiller les batteries des capteurs ;
-   consulter la dernière communication lorsqu'un capteur semble figé ;
-   utiliser les favoris et le masquage pour garder un catalogue lisible
    ;
-   consulter les journaux Homebridge avant toute opération corrective
    importante.

------------------------------------------------------------------------

## Assistance

En cas de difficulté :

1.  consultez le [guide de dépannage](depannage.md) ;
2.  vérifiez les journaux Homebridge ;
3.  identifiez la source concernée : Home Assistant, Matter ou les deux
    ;
4.  relevez la version du plugin et de Homebridge ;
5.  ouvrez une issue GitHub si le problème persiste.

------------------------------------------------------------------------

## Conclusion

Homebridge HA Virtual Devices V2 permet d'utiliser Home Assistant et
Matter comme sources indépendantes ou complémentaires tout en conservant
une gestion commune des appareils.

Le catalogue persistant, la synchronisation dynamique et l'interface
d'administration permettent de gérer les capteurs sans multiplier les
configurations manuelles.
