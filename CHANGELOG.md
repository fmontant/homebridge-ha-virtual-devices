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