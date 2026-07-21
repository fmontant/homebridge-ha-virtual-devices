# Dépannage

Ce document regroupe les problèmes les plus fréquemment rencontrés avec **Homebridge HA Virtual Devices** ainsi que les solutions recommandées.

Avant d'ouvrir une issue sur GitHub, prenez quelques minutes pour consulter cette page. La majorité des difficultés courantes peuvent être résolues rapidement.

---

# Avant de commencer

Dans la plupart des cas, les informations nécessaires au diagnostic se trouvent dans les journaux Homebridge.

Depuis l'interface Homebridge :

1. ouvrez **Logs** ;
2. redémarrez le plugin si nécessaire ;
3. reproduisez le problème ;
4. consultez les derniers messages affichés.

Les journaux constituent la première source d'information pour comprendre un dysfonctionnement.

---

# Le plugin ne démarre pas

## Symptômes

- le plugin apparaît en erreur ;
- Homebridge signale un échec au démarrage ;
- aucun accessoire n'est créé.

## Vérifications

Contrôlez :

- la configuration du plugin ;
- les paramètres de connexion à Home Assistant ;
- le jeton d'accès utilisé ;
- la disponibilité du serveur Home Assistant.

Consultez ensuite les journaux Homebridge afin d'identifier le message d'erreur précis.

---

# Aucun appareil n'est découvert

## Symptômes

Le catalogue reste vide après le démarrage.

## Causes possibles

- Home Assistant n'est pas joignable ;
- l'authentification a échoué ;
- aucun capteur compatible n'est présent ;
- la connexion WebSocket ne fonctionne pas.

## Vérifications

Assurez-vous que :

- Home Assistant est opérationnel ;
- le jeton possède les droits nécessaires ;
- les capteurs sont visibles dans Home Assistant ;
- le plugin est correctement connecté.

---

# Un capteur n'apparaît pas

## Symptômes

Un capteur existe dans Home Assistant mais n'apparaît pas dans le catalogue.

## Vérifications

Vérifiez :

- que le capteur est compatible avec le plugin ;
- qu'il n'est pas désactivé ;
- qu'il n'est pas masqué ;
- que Home Assistant publie correctement son état.

Consultez également les journaux afin de vérifier que le capteur a bien été découvert.

---

# Le capteur apparaît comme « Manquant »

## Symptômes

Le catalogue indique qu'un appareil est **Manquant**.

## Explication

Le plugin ne retrouve plus ce capteur lors de la phase de découverte.

Cela peut arriver :

- après une suppression dans Home Assistant ;
- après un changement d'identifiant ;
- lorsque le capteur est temporairement indisponible.

Le plugin conserve volontairement toutes les préférences de l'appareil afin de permettre sa restauration automatique.

---

# L'accessoire indique « Sans réponse » dans Apple Home

## Symptômes

Apple Home affiche :

```
Sans réponse
```

## Causes possibles

- batterie déchargée ;
- capteur hors de portée ;
- problème Zigbee ;
- problème de communication avec Home Assistant.

Le plugin conserve l'accessoire et met à jour son état dès que le capteur redevient disponible.

---

# La température ne se met plus à jour

## Vérifications

Contrôlez :

- la valeur dans Home Assistant ;
- la date de la **Dernière communication** ;
- les journaux Homebridge.

Si Home Assistant ne reçoit plus de données, le plugin ne peut pas créer de nouvelles mises à jour.

---

# La date « Dernière communication » est ancienne

Cette information correspond au dernier événement reçu depuis Home Assistant.

Une date ancienne indique généralement :

- un capteur inactif ;
- une batterie faible ;
- une perte de communication ;
- un problème radio.

Cette information est particulièrement utile pour détecter un capteur bloqué.

---

# Les favoris disparaissent

Les favoris sont enregistrés dans le catalogue persistant.

S'ils semblent avoir disparu :

- vérifiez que le fichier du catalogue est toujours présent ;
- assurez-vous que Homebridge possède les droits d'écriture nécessaires ;
- consultez les journaux afin de détecter une éventuelle erreur de sauvegarde.

---

# Une modification n'apparaît pas immédiatement

Depuis la version **1.0.9**, la majorité des modifications sont synchronisées automatiquement.

Si une modification ne semble pas prise en compte :

- patientez quelques secondes ;
- actualisez l'interface Homebridge ;
- vérifiez les journaux.

Un redémarrage de Homebridge ne devrait être nécessaire que dans des cas exceptionnels.

---

# L'interface d'administration ne s'affiche pas correctement

## Vérifications

Essayez successivement :

- actualiser la page ;
- vider le cache du navigateur ;
- redémarrer Homebridge ;
- vérifier que l'installation du plugin est complète.

---

# Une mise à jour du plugin s'est mal passée

Après une mise à jour :

1. vérifiez la version installée ;
2. redémarrez Homebridge ;
3. consultez les journaux.

Le catalogue utilisateur est conservé entre deux versions et ne doit normalement pas être perdu.

---

# Vérifier la version installée

Depuis le terminal :

```bash
npm list homebridge-ha-virtual-devices
```

Vous pouvez également consulter la page du plugin dans l'interface Homebridge.

---

# Recompiler le projet

Pour les développeurs :

Compilation complète :

```bash
npm run build:all
```

Compilation du plugin uniquement :

```bash
npm run build
```

Compilation de l'interface graphique :

```bash
npm run build:ui
```

Analyse du code :

```bash
npm run lint
```

---

# Réinstaller le plugin

En cas de doute, une réinstallation propre peut résoudre certains problèmes.

Exemple :

```bash
npm uninstall homebridge-ha-virtual-devices
npm install homebridge-ha-virtual-devices
```

Ou, pour une archive locale :

```bash
npm install ./homebridge-ha-virtual-devices-x.y.z.tgz
```

---

# Collecter des informations avant de demander de l'aide

Avant d'ouvrir une issue sur GitHub, essayez de réunir les informations suivantes :

- version du plugin ;
- version de Homebridge ;
- version de Home Assistant ;
- version de Node.js ;
- système d'exploitation ;
- extrait des journaux ;
- description précise du problème ;
- étapes permettant de reproduire le comportement observé.

Ces informations facilitent considérablement le diagnostic.

---

# Bonnes pratiques

Pour limiter les problèmes :

- maintenez Homebridge à jour ;
- maintenez Home Assistant à jour ;
- utilisez une version récente de Node.js ;
- surveillez les batteries des capteurs ;
- consultez régulièrement les journaux du plugin.

---

# Si le problème persiste

Si aucune des solutions proposées ne résout votre problème :

1. vérifiez que celui-ci n'a pas déjà été signalé sur GitHub ;
2. ouvrez une nouvelle issue en joignant toutes les informations utiles ;
3. ajoutez les journaux correspondants ainsi que le contexte permettant de reproduire le problème.

Plus le rapport sera précis, plus il sera facile d'identifier et de corriger l'origine du dysfonctionnement.
