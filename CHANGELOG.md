# Changelog

All notable changes to **Homebridge HA Virtual Devices** are documented in this file.

This project follows **Semantic Versioning (SemVer)**.

The format of this changelog is inspired by **Keep a Changelog** and is maintained in accordance with the project's **Publication Policy**.

Its purpose is to provide a clear, factual and chronological record of every published release.

Future features and planned improvements are documented in **ROADMAP.md**.

---
[English](#english) | [Français](#français)

# English

## [Unreleased]

> [!NOTE]
> This section contains completed changes that have not yet been published.
> Entries are moved to the appropriate version section when a new release is published.

### Changed

- Describe the changes included in this release.

---

## [1.3.6] - 2026-08-06

### Changed

- Prevent Homebridge startup failure on a fresh installation when the plugin storage directory does not yet exist.

---

## [1.3.5] - 2026-08-06

### Changed

- Improved plugin startup validation and lifecycle management.
- Removed unused Vue template assets and development traces from the Homebridge UI.
- Improved overall project maintainability and code quality.

---

## [1.3.4] - 2026-08-05

### Changed

- Added a complete development toolkit including the `dev`, `doctor` and `logs` commands.
- Improved automated NAS deployment with automatic Homebridge container detection.
- Improved Homebridge diagnostics with plugin, catalog and storage information.
- Added integrated Homebridge log filtering utilities.
- Expanded the developer toolkit documentation.
- Updated the project roadmap and README documentation.
- Improved the release workflow by recreating a ready-to-use `Unreleased` section after each release.

---

## [1.3.3] - 2026-07-31

### Changed

- Improved release preparation by prompting for missing changelog entries.
- Improved generated changelog formatting and Unreleased section maintenance.

---

## [1.3.2] - 2026-07-31

### Changed
- Improved catalog management and HomeKit accessory synchronization.
- Improved the sensor administration interface.
- Improved changelog preparation and empty-section guidance in the release toolkit.
- Fixed Vue asset generation to ensure reproducible UI builds.

---

## [1.3.1] - 2026-07-30

### Changed

- Reintroduced the sensor deletion confirmation dialog after resolving the issues identified in previous releases.
- Improved the integrated Homebridge confirmation dialog for a clearer and more reliable deletion workflow.
- Harmonized French, English, German and Spanish translations.
- Refined several user interface texts for better consistency across all supported languages.

### Fixed

- Fixed the sensor deletion confirmation workflow.
- Fixed the internationalization (i18n) resource structure.
- Corrected German and Spanish wording and typography.
- Fixed several user interface consistency issues.

---

## [1.3.0] - 2026-07-27

### Added

- Added full multilingual support (French, English, German and Spanish).
- Added German localization.
- Added Spanish localization.

### Changed

- Added automatic browser language detection.
- Changed the fallback language to French for unsupported locales.
- Introduced a Vue I18n based internationalization framework.

### Improved

- Improved translation consistency across all supported languages.
- Improved the overall localization architecture for future language additions.

---

## [1.2.1] - 2026-07-26

### Documentation

- Introduced the project's documentation framework.
- Added a structured developer documentation toolkit.
- Added deployment, publication and troubleshooting guides.
- Added French and English project documentation.
- Established the project's publication workflow.

---

## [1.2.0] - 2026-07-23

### Added

- Added a redesigned Homebridge administration interface.
- Added dedicated **Configuration** and **Devices** views.
- Added integrated plugin configuration from the Homebridge user interface.

### Changed

- Simplified the plugin configuration workflow.
- Improved the overall administration experience.

### Improved

- Improved user interface consistency.
- Improved project architecture and long-term maintainability.

<!-- ====================================================================== -->

---

# Français

## [Unreleased]

> [!NOTE]
> Cette section recense les changements terminées mais qui n'ont pas encore été publiées.
> Son contenu est déplacé vers la version correspondante lors de chaque publication.

### Changed

- Décrire les changements inclus dans cette version.

---

## [1.3.6] - 2026-08-06

### Changed

- Correction d'un échec du démarrage de Homebridge lors d'une nouvelle installation lorsque le répertoire de stockage du plugin n'existe pas encore.

---

## [1.3.5] - 2026-08-06

### Changed

- Amélioration de la validation du démarrage du plugin et de la gestion de son cycle de vie.
- Suppression des ressources Vue inutilisées ainsi que des traces de développement de l'interface Homebridge.
- Amélioration de la maintenabilité globale du projet et de la qualité du code.

---

## [1.3.4] - 2026-08-05

### Changed

- Ajout d'un toolkit de développement complet incluant les commandes `dev`, `doctor` et `logs`.
- Amélioration du déploiement automatisé sur NAS avec détection automatique du conteneur Homebridge.
- Amélioration des outils de diagnostic Homebridge avec les informations du plugin, du catalogue et du stockage.
- Ajout d’outils intégrés de filtrage des journaux Homebridge.
- Enrichissement de la documentation destinée aux développeurs.
- Mise à jour de la feuille de route du projet ainsi que de la documentation README.
- Amélioration du workflow de publication avec la recréation automatique d’une section `Unreleased` prête à l’emploi après chaque publication.

---

## [1.3.3] - 2026-07-31

### Changed

- Amélioration de la préparation des publications en demandant les entrées manquantes du changelog.
- Amélioration de la mise en forme du changelog généré et de la gestion de la section `Unreleased`.

---

## [1.3.2] - 2026-07-31

### Changed

- Amélioration de la gestion du catalogue et de la synchronisation des accessoires HomeKit.
- Amélioration de l’interface d’administration des capteurs.
- Amélioration de la préparation du changelog et des indications affichées lorsque les sections sont vides dans le toolkit de publication.

### Fixed

- Correction de la génération des ressources Vue afin de garantir des compilations reproductibles de l’interface utilisateur.

---

## [1.3.1] - 2026-07-30

### Changed

- Réintroduction de la boîte de dialogue de confirmation de suppression des capteurs après résolution des problèmes identifiés dans les versions précédentes.
- Amélioration de la boîte de dialogue de confirmation intégrée à Homebridge afin d’offrir un processus de suppression plus clair et plus fiable.
- Harmonisation des traductions françaises, anglaises, allemandes et espagnoles.
- Harmonisation de plusieurs textes de l’interface utilisateur afin d'améliorer la cohérence entre toutes les langues prises en charge.

### Fixed

- Correction du fonctionnement de la confirmation de suppression des capteurs.
- Correction de la structure des ressources d’internationalisation (i18n).
- Correction des formulations et de la typographie en allemand et en espagnol.
- Correction de plusieurs incohérences de l’interface utilisateur.

---

## [1.3.0] - 2026-07-27

### Added

- Ajout de la prise en charge complète du multilinguisme (français, anglais, allemand et espagnol).
- Ajout de la traduction allemande.
- Ajout de la traduction espagnole.

### Changed

- Ajout de la détection automatique de la langue du navigateur.
- Le français devient la langue de repli lorsque la langue du navigateur n'est pas prise en charge.
- Mise en place de l'internationalisation avec Vue I18n.

### Improved

- Amélioration de la cohérence des traductions pour l'ensemble des langues prises en charge.
- Préparation de l'architecture afin de faciliter l'ajout de nouvelles langues.

---

## [1.2.1] - 2026-07-26

### Documentation

- Mise en place du cadre documentaire du projet.
- Ajout d'un ensemble structuré de documentation destiné aux développeurs.
- Ajout des guides de déploiement, de publication et de dépannage.
- Ajout de la documentation du projet en français et en anglais.
- Formalisation du processus de publication du projet.

---

## [1.2.0] - 2026-07-23

### Added

- Ajout d'une nouvelle interface d'administration Homebridge.
- Ajout de vues dédiées **Configuration** et **Capteurs**.
- Ajout de la configuration intégrée du plugin depuis l'interface utilisateur Homebridge.

### Changed

- Simplification du processus de configuration du plugin.
- Amélioration de l'expérience d'administration.

### Improved

- Amélioration de la cohérence de l'interface utilisateur.
- Amélioration de l'architecture du projet et de sa maintenabilité à long terme.