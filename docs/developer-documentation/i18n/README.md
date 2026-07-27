# Internationalization

The Homebridge HA Virtual Devices plugin is designed to support multiple languages through a centralized translation system based on **vue-i18n**.

Internationalization is considered part of the application's architecture and is not treated as a later enhancement.

---

## Objectives

The internationalization system has several goals:

- provide a fully localized user interface;
- keep business logic independent from displayed text;
- simplify the addition of new languages;
- ensure consistency across the entire application;
- avoid duplicated translations.

---

## Architecture

Translations are stored in dedicated language files.

```
homebridge-ui/
└── src/
    └── locales/
        ├── en.json
        └── fr.json
```

English is the reference language.

All translation keys are written in English.

Additional languages reuse the exact same structure.

---

## Documentation

The complete architecture is described in:

- TranslationReference.md

This document defines:

- naming conventions;
- translation key organization;
- development guidelines;
- best practices;
- migration rules.

---

## Development Rules

All new user-visible text must be translated.

Hard-coded strings inside Vue components should be avoided.

Every new feature must update:

- en.json
- all supported language files

before being considered complete.

---

## Technologies

The plugin uses:

- vue-i18n

No component should contain language-specific business logic.

Only translation keys should be used within the UI.

---

## Future Languages

The architecture is designed to support additional languages without changing the application code.

Examples include:

- German
- Spanish
- Italian
- Dutch
- Portuguese

Adding a language only requires creating a new translation file and registering it in the i18n configuration.
