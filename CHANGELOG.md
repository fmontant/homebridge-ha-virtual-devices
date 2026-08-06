# Changelog

All notable changes to **Homebridge HA Virtual Devices** are documented in this file.

This project follows **Semantic Versioning (SemVer)**.

The format of this changelog is inspired by **Keep a Changelog** and is maintained in accordance with the project's **Publication Policy**.

Its purpose is to provide a clear, factual and chronological record of every published release.

Future features and planned improvements are documented in **ROADMAP.md**.

---

## [Unreleased]

> [!NOTE]
> This section contains completed changes that have not yet been published.
> Entries are moved to the appropriate version section when a new release is published.

### Changed

- Describe the changes included in this release.

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
