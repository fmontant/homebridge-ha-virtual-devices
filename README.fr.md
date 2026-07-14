# Homebridge HA Virtual Devices

Expose automatiquement tes capteurs environnementaux Home Assistant dans Apple Maison sous forme de thermostats natifs.

Homebridge HA Virtual Devices découvre automatiquement les capteurs compatibles de Home Assistant et les expose dans Apple Maison comme de véritables accessoires Thermostat HomeKit.

Au lieu d'afficher séparément la température, l'humidité et la batterie, Apple Maison présente un unique thermostat regroupant les informations les plus utiles.

Aucune association manuelle.

Aucun accessoire en double.

Aucun polling.

Une intégration entièrement native dans Apple Maison.

> La réalité avant tout.
>
> Toutes les captures d'écran de cette documentation proviennent d'une installation réelle du plugin. Les informations personnelles ont été anonymisées lorsque cela était nécessaire.

![Bannière](docs/images/banner.png)

---

## Pourquoi ce plugin ?

Home Assistant est excellent pour collecter les données environnementales.

Apple Maison offre l'une des meilleures interfaces pour piloter son logement au quotidien.

Homebridge HA Virtual Devices relie automatiquement ces deux univers en exposant les capteurs compatibles sous forme d'accessoires Thermostat HomeKit natifs.

Le résultat est une interface Apple Maison plus propre, plus cohérente et totalement intégrée.

---

## Fonctionnalités

- Découverte automatique des capteurs environnementaux compatibles
- Thermostats natifs Apple Maison
- Température et humidité regroupées dans un seul accessoire
- Détection automatique du fabricant et du modèle
- Récupération automatique des informations du firmware
- Synchronisation en temps réel
- Configuration minimale
- Exclusion d'appareils
- Expérience HomeKit native
- Aucun accessoire à créer manuellement

---

## Captures d'écran

Le plugin s'intègre naturellement dans Apple Maison tout en respectant son interface d'origine.

La température et l'humidité sont regroupées dans un unique thermostat afin d'offrir une présentation plus claire que plusieurs capteurs indépendants.

| Vue générale | Thermostat | Informations |
|:------------:|:----------:|:------------:|
| ![Vue générale](docs/screenshots/apple-home-overview.png) | ![Thermostat](docs/screenshots/apple-home-thermostat.png) | ![Informations](docs/screenshots/apple-home-accessory-info.png) |

Toutes les captures proviennent d'une installation réelle du plugin.

Seules les informations personnelles ont été anonymisées. L'interface Apple Maison n'a jamais été modifiée.

---

## Fonctionnement

```text
Home Assistant
        │
Découverte automatique
        │
        ▼
Homebridge HA Virtual Devices
        │
Thermostat HomeKit natif
        │
        ▼
Apple Maison
```

Le plugin détecte automatiquement les capteurs compatibles, regroupe les informations disponibles et les expose dans Apple Maison sous forme de thermostats natifs.

---

## Installation

```bash
npm install -g homebridge-ha-virtual-devices
```

Configure ensuite :

- l'adresse de Home Assistant ;
- un jeton d'accès longue durée.

Redémarre Homebridge.

Les capteurs compatibles apparaissent automatiquement dans Apple Maison.

---

## Compatibilité

- Homebridge v1.8 ou supérieur
- Home Assistant 2024.6 ou supérieur
- Apple Maison (iOS 16+ / macOS 13+)
- Installations Home Assistant compatibles Matter

---

## Feuille de route

- Prise en charge de nouveaux capteurs
- Options avancées de découverte
- Filtrage enrichi des appareils
- Outils de diagnostic
- Métadonnées supplémentaires

---

## Contribuer

Les contributions, suggestions et rapports de bugs sont les bienvenus.

Merci de consulter le fichier `CONTRIBUTING.md` avant d'ouvrir une Issue ou une Pull Request.

---

## Licence

Distribué sous licence MIT.