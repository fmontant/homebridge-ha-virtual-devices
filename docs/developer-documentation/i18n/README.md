# Internationalization

Homebridge HA Virtual Devices uses **vue-i18n** for the custom Homebridge UI.

Internationalization is part of the UI architecture and must remain synchronized with feature development.

---

## Supported Languages

The current UI ships with four locales:

```text
fr: French
en: English
de: German
es: Spanish
```

Translation files are stored in:

```text
homebridge-ui/src/locales/
```

with the current structure:

```text
homebridge-ui/
└── src/
    ├── i18n.ts
    └── locales/
        ├── de.json
        ├── en.json
        ├── es.json
        └── fr.json
```

---

## Reference Language

For documentation and translation review in this project, **French is the reference language**.

New or corrected user-facing wording is therefore first validated in French, then synchronized into:

```text
English
German
Spanish
```

This editorial rule must not be confused with the TypeScript message schema currently used in `i18n.ts`.

The code defines:

```ts
type MessageSchema = typeof en;
```

so `en.json` is currently used as the compile-time shape for `vue-i18n` typing.

That technical choice does **not** make English the editorial source of truth for translation work.

---

## Locale Selection

The UI derives the initial locale from the browser language:

```ts
navigator.language.split('-')[0]
```

If the detected language is one of:

```text
de
en
es
fr
```

that locale is used.

Otherwise the initial locale defaults to:

```text
en
```

---

## Fallback Locale

The configured fallback locale is:

```text
fr
```

Therefore, when a translation key is unavailable in the active locale, Vue I18n can fall back to the French message.

This reinforces the need to keep the French locale complete.

---

## Current Initialization

The active i18n setup is defined in:

```text
homebridge-ui/src/i18n.ts
```

and follows this structure:

```ts
createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'fr',
  messages: {
    de,
    en,
    es,
    fr,
  },
});
```

The UI therefore uses Vue I18n in Composition API mode rather than legacy mode.

---

## Translation Rules

All user-visible text should use translation keys whenever practical.

New UI work should avoid introducing language-specific text directly into Vue components.

Each functional change that adds or modifies visible wording should ultimately keep the four locale files synchronized:

```text
fr.json
en.json
de.json
es.json
```

During V2 development, temporary hard-coded strings may be identified during implementation review, but the translation pass must resolve them before release.

---

## Key Structure

All locale files must preserve the same logical key hierarchy.

For example:

```json
{
  "matter": {
    "title": "...",
    "description": "...",
    "commission": "..."
  }
}
```

The translated values change by language; the key structure should not.

This allows components to reference one stable translation path regardless of the active locale.

---

## Matter V2

V2 adds Matter-specific UI text, including:

- provider selection;
- Matter commissioning;
- pairing-code instructions;
- commissioning success and failure messages;
- Matter device/source labels.

The French wording is the reference for the final translation review.

In particular, the Matter commissioning instructions must preserve the exact user workflow:

```text
Apple Home
    │
    ▼
open the device settings
    │
    ▼
activate pairing mode
    │
    ▼
Apple Home generates a new Matter sharing code
    │
    ▼
enter that code in the plugin
    │
    ▼
add the Matter sensor
```

Translations must preserve this meaning rather than simplifying it into a generic "enter pairing code" instruction.

---

## Separation from Business Logic

Components should not contain language-specific business decisions.

Translation should remain a presentation concern.

Preferred pattern:

```text
component logic
    │
    ▼
translation key
    │
    ▼
vue-i18n
    │
    ▼
localized text
```

Avoid:

```text
if locale === 'fr' then ...
else if locale === 'en' then ...
```

for normal UI wording.

---

## Adding a Language

Adding another locale requires, at minimum:

1. creating a new JSON file in `homebridge-ui/src/locales/`;
2. adding the locale import in `i18n.ts`;
3. extending `SupportedLocale`;
4. including it in the supported browser-locale list;
5. registering it in `messages`;
6. ensuring that its translation-key structure matches the existing locales.

No provider or business-logic changes should be required only to add a language.

---

## Translation Reference

Detailed conventions, synchronization rules, review workflow, and V2 translation requirements are documented in:

- [`TranslationReference.md`](TranslationReference.md)

---

## Related Documentation

- [`../README.md`](../README.md): developer documentation index
- [`../architecture/README.md`](../architecture/README.md): architecture documentation
- [`../Matter/README.md`](../Matter/README.md): Matter V2 architecture
