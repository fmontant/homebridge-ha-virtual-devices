# Dépannage

Ce document regroupe les vérifications recommandées en cas de problème
avec **Homebridge HA Virtual Devices V2**.

La première question à se poser est désormais : **quelle source est
concernée ?**

-   Home Assistant ;
-   Matter ;
-   les deux.

Cette distinction évite de rechercher un problème Home Assistant
lorsqu'un appareil provient de Matter, et inversement.

------------------------------------------------------------------------

## Avant de commencer

Consultez d'abord les journaux Homebridge :

1.  ouvrez **Logs** dans l'interface Homebridge ;
2.  reproduisez le problème ;
3.  repérez les messages concernant Homebridge HA Virtual Devices ;
4.  notez la source et l'appareil concernés.

Évitez de supprimer le catalogue ou de réinstaller le plugin avant
d'avoir identifié la cause.

------------------------------------------------------------------------

## Le plugin ne démarre pas

Vérifiez :

-   la configuration du plugin ;
-   qu'au moins une source est activée ;
-   les messages d'erreur dans les journaux Homebridge.

Si Home Assistant est activé, vérifiez également son URL et son jeton.

Si Matter est activé, recherchez dans les journaux les messages liés au
provider Matter.

------------------------------------------------------------------------

## Impossible d'enregistrer la configuration

Au moins une source doit être active :

-   **Utiliser Home Assistant** ;
-   **Utiliser Matter**.

Si Home Assistant est activé, son URL et son jeton doivent être
renseignés.

En mode Matter uniquement, les informations Home Assistant ne sont pas
nécessaires.

------------------------------------------------------------------------

## Problèmes Home Assistant

### Aucun appareil Home Assistant n'est découvert

Vérifiez :

-   que **Utiliser Home Assistant** est activé ;
-   que Home Assistant est joignable ;
-   que l'URL est correcte ;
-   que le jeton est valide ;
-   que les capteurs compatibles existent dans Home Assistant ;
-   que la connexion du plugin à Home Assistant est établie.

### Un capteur Home Assistant n'apparaît pas

Vérifiez :

-   que le capteur existe toujours dans Home Assistant ;
-   qu'il fournit une capacité prise en charge ;
-   qu'il n'est pas ignoré par la configuration ;
-   son état dans le catalogue ;
-   les journaux de découverte.

### La température ne se met plus à jour avec Home Assistant

Comparez :

-   la valeur affichée dans Home Assistant ;
-   la valeur du catalogue/plugin ;
-   la **Dernière communication** ;
-   les journaux Homebridge.

Si Home Assistant ne reçoit lui-même plus de nouvelle valeur, le plugin
ne peut pas la transmettre.

### Home Assistant redémarre

Le plugin dispose d'une logique de reconnexion à Home Assistant.

Après un redémarrage de Home Assistant, laissez quelques instants à la
connexion pour être rétablie puis vérifiez les journaux si les mises à
jour ne reprennent pas.

------------------------------------------------------------------------

## Problèmes Matter

### Le panneau « Ajouter un capteur Matter » n'apparaît pas

Vérifiez que **Utiliser Matter** est activé dans la configuration du
plugin.

Le panneau Matter est masqué lorsque Matter est désactivé.

### Quel code Matter faut-il saisir ?

Pour partager avec le plugin un appareil déjà présent dans Apple Home :

1.  ouvrez les réglages de l'appareil dans Maison ;
2.  choisissez **Activer le mode jumelage** ;
3.  utilisez le **nouveau code de partage Matter** généré par Maison.

Saisissez ce code dans le panneau **Ajouter un capteur Matter**.

### L'ajout Matter échoue

Vérifiez :

-   que Matter est activé dans le plugin ;
-   que l'appareil est bien en mode jumelage ;
-   que le code saisi est le nouveau code de partage généré ;
-   que le code n'a pas expiré ou cessé d'être utilisable ;
-   les journaux Homebridge pour obtenir le message d'erreur exact.

Si nécessaire, réactivez le mode jumelage dans Maison afin d'obtenir un
nouveau code.

### Le capteur Matter est ajouté mais son nom est générique

Après l'ajout, utilisez le catalogue pour lui attribuer un nom plus
explicite lorsque l'interface le permet.

Le plugin conserve le nom personnalisé lors des redécouvertes Matter.

### Une valeur Matter ne se met plus à jour

Vérifiez :

-   la disponibilité du capteur ;
-   la **Dernière communication** ;
-   si l'appareil continue de fonctionner normalement dans son
    écosystème Matter ;
-   les journaux Homebridge liés au provider Matter.

Ne modifiez pas immédiatement le commissioning : commencez par
déterminer si le problème concerne l'appareil, la communication Matter
ou uniquement sa publication HomeKit.

------------------------------------------------------------------------

## Le capteur apparaît comme « Manquant »

Un appareil **Manquant** est connu du catalogue mais n'est plus retrouvé
par sa source.

Cela peut notamment arriver après :

-   la suppression ou le renommage technique d'une entité Home Assistant
    ;
-   la disparition d'un appareil de la source ;
-   une indisponibilité prolongée ou un problème de découverte.

Le catalogue conserve les préférences de l'appareil.

Avant de supprimer quoi que ce soit, identifiez sa **source** et
vérifiez si elle le voit encore.

------------------------------------------------------------------------

## L'accessoire indique « Sans réponse » dans Apple Home

Les causes possibles dépendent de la source et du capteur :

-   batterie déchargée ;
-   capteur hors de portée ;
-   problème radio ;
-   Home Assistant indisponible pour un appareil HA ;
-   problème de communication Matter pour un appareil Matter ;
-   Homebridge ou le plugin indisponible.

Commencez par vérifier la valeur et la disponibilité dans la source
concernée, puis les journaux Homebridge.

------------------------------------------------------------------------

## La date « Dernière communication » est ancienne

Une date ancienne signifie qu'aucune communication plus récente n'a été
enregistrée pour l'appareil.

Elle peut révéler :

-   un capteur inactif ;
-   une batterie faible ou déchargée ;
-   une perte de communication ;
-   un problème de connexion avec la source.

Utilisez la source affichée dans le catalogue pour orienter le
diagnostic.

------------------------------------------------------------------------

## Les favoris, noms ou préférences semblent avoir disparu

Les préférences sont enregistrées dans le catalogue persistant.

Vérifiez :

-   que le catalogue est toujours présent ;
-   que Homebridge possède les droits nécessaires pour l'utiliser ;
-   les journaux pour détecter une erreur de lecture ou d'écriture ;
-   que vous consultez bien le même appareil/source.

Évitez de supprimer le catalogue tant que le diagnostic n'est pas
terminé.

------------------------------------------------------------------------

## La pièce du plugin ne change pas la pièce dans Apple Maison

C'est le comportement attendu.

La pièce enregistrée dans le catalogue est une préférence interne au
plugin. Homebridge ne peut pas, par le fonctionnement normal d'un
plugin, affecter automatiquement un accessoire à une pièce de
l'application Maison.

Pour déplacer l'accessoire dans Apple Home, effectuez l'opération
directement dans l'app Maison.

------------------------------------------------------------------------

## Une modification n'apparaît pas immédiatement

Actualisez d'abord l'interface Homebridge et laissez quelques secondes à
la synchronisation.

Si le problème persiste :

-   vérifiez les journaux ;
-   identifiez si la modification concerne une préférence du catalogue
    ou une valeur provenant d'une source ;
-   vérifiez l'état de la source concernée.

Un redémarrage ne doit pas être la première méthode de diagnostic.

------------------------------------------------------------------------

## L'interface d'administration ne s'affiche pas correctement

Essayez :

-   d'actualiser la page ;
-   de rouvrir la configuration du plugin ;
-   de vérifier les journaux Homebridge ;
-   de redémarrer Homebridge si l'interface reste indisponible.

En cas de problème après une mise à jour, vérifiez également la version
réellement installée.

------------------------------------------------------------------------

## Une mise à jour du plugin s'est mal passée

Après une mise à jour :

1.  vérifiez la version installée ;
2.  consultez les journaux ;
3.  vérifiez que la configuration a été conservée ;
4.  vérifiez les sources activées ;
5.  redémarrez Homebridge si nécessaire.

Une configuration provenant de la version 1.x sans paramètres de source
explicites est interprétée avec Home Assistant activé et Matter
désactivé.

------------------------------------------------------------------------

## Vérifier la version installée

Depuis le terminal :

``` bash
npm list homebridge-ha-virtual-devices
```

La version est également visible dans l'interface Homebridge.

------------------------------------------------------------------------

## Réinstallation

Une réinstallation ne doit intervenir qu'après les vérifications
précédentes.

Si elle est nécessaire, utilisez de préférence les mécanismes
d'installation de Homebridge afin de conserver une installation
cohérente avec votre environnement.

La suppression du plugin ne doit pas être confondue avec la suppression
volontaire de ses données persistantes.

------------------------------------------------------------------------

## Collecter les informations avant de demander de l'aide

Préparez :

-   version du plugin ;
-   version de Homebridge ;
-   version de Node.js ;
-   système d'exploitation ;
-   source concernée : Home Assistant, Matter ou les deux ;
-   version de Home Assistant si elle est concernée ;
-   type de capteur ;
-   extrait pertinent des journaux ;
-   description précise du problème ;
-   étapes permettant de le reproduire.

Ne publiez pas votre jeton d'accès Home Assistant ni d'autres
informations d'authentification.

------------------------------------------------------------------------

## Si le problème persiste

Avant d'ouvrir une issue GitHub :

1.  vérifiez qu'un problème identique n'est pas déjà signalé ;
2.  rassemblez les informations de diagnostic ;
3.  décrivez le résultat attendu et le résultat observé ;
4.  joignez uniquement les extraits de journaux utiles, après avoir
    retiré les informations sensibles.

Un rapport précis permet d'identifier beaucoup plus rapidement l'origine
du problème.
