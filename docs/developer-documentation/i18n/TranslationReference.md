# Translation Reference

This document defines the translation conventions and review rules for the **Homebridge HA Virtual Devices** custom UI.

It complements [`README.md`](README.md), which describes the runtime internationalization architecture.

## Scope

These rules apply to user-visible strings in:

```text
homebridge-ui/
```

The currently supported locales are:

| Locale | Language |
|---|---|
| `fr` | French |
| `en` | English |
| `de` | German |
| `es` | Spanish |

The locale files are stored in:

```text
homebridge-ui/src/locales/
```

## Reference Language

**French is the editorial reference language for the project.**

When wording is introduced, corrected, or clarified, the French version is validated first. The same meaning is then reproduced in English, German, and Spanish.

This is an editorial convention, not a description of the current TypeScript schema. `i18n.ts` currently declares:

```ts
type MessageSchema = typeof en;
```

Therefore `en.json` supplies the compile-time message shape, while `fr.json` remains the reference for wording and translation review.

## Synchronization Rule

The four locale files should expose the same translation-key structure.

A feature is not translation-complete when a key exists only in one language.

For a structure such as:

```json
{
  "matter": {
    "title": "...",
    "description": "...",
    "commission": "..."
  }
}
```

the paths:

```text
matter.title
matter.description
matter.commission
```

should exist in every supported locale.

Translated values may differ grammatically, but the semantic meaning must remain equivalent.

## Key Naming

Translation keys should describe the UI concept rather than reproduce the displayed sentence.

Prefer stable semantic names such as:

```text
matter.title
matter.description
matter.pairingCode
matter.commission
matter.commissioning
matter.instructions
matter.errors.missingCode
```

Avoid keys tied to one language's sentence structure.

Keys should remain stable when wording is improved without changing the underlying UI concept.

## Component Usage

User-visible strings should normally be obtained through Vue I18n.

Preferred:

```vue
{{ t('matter.title') }}
```

Avoid introducing new hard-coded language-specific labels directly in components.

Business logic must not depend on translated values. A translation is presentation data, not an application state or identifier.

## Interpolation

Dynamic values should use placeholders instead of sentence concatenation.

For example:

```json
{
  "failed": "Impossible d’ajouter le capteur Matter : {message}."
}
```

and:

```ts
t('matter.failed', { message })
```

Translations may then place `{message}` according to the grammar of each language.

Placeholder names must remain identical across locales.

## V2 Provider Terminology

V2 supports two independent device sources:

```text
Home Assistant
Matter
```

Provider names are product/protocol names and should remain recognizable in every locale.

Translations must clearly distinguish:

- enabling the Home Assistant provider;
- enabling the Matter provider;
- Home Assistant connection settings;
- Matter commissioning;
- the source associated with a discovered device.

The UI permits:

```text
Home Assistant only
Matter only
Home Assistant + Matter
```

It must not imply that Home Assistant is required when Matter is used alone.

## Matter Commissioning Terminology

The Matter commissioning instructions require particular care because the distinction between the existing Matter code and a newly generated sharing code is operationally important.

The reference workflow is:

```text
open the sensor settings in Apple Home
        │
        ▼
choose “Enable Pairing Mode”
        │
        ▼
Apple Home generates a new Matter sharing code
        │
        ▼
copy that new code
        │
        ▼
enter it in the plugin
        │
        ▼
add the sensor
```

Translations must preserve the fact that **Apple Home generates a new Matter sharing code after pairing mode is enabled**.

Do not reduce this instruction to a vague equivalent of:

```text
Enter the Matter code.
```

That loses information required by the user to complete commissioning.

## HomeKit and Apple Home

Use terminology consistently:

- **HomeKit** when referring to the Apple home-automation framework or technical publication model;
- **Apple Home** / the localized name of Apple's Home app when referring to actions performed by the user in the application.

Translations should preserve that distinction where it affects instructions.

## Device and Catalog Terminology

V2 documentation and UI distinguish several concepts:

- **source/provider**: Home Assistant or Matter;
- **device**: discovered physical/logical device;
- **catalog**: persistent plugin device catalog;
- **HomeKit name**: publication/display name used by the plugin;
- **room**: plugin catalog preference where applicable.

The plugin's internal room preference must not be translated in a way that suggests it automatically moves an accessory between rooms in Apple Home.

## Errors and Status Messages

Error messages should tell the user what failed without exposing unnecessary implementation detail.

When the underlying error message is intentionally surfaced, use interpolation.

Status wording should remain consistent across components. Do not use several translations for the same state unless the contexts genuinely require different wording.

## Punctuation and Typography

Each translation should follow the normal typography of its language rather than mechanically reproducing French punctuation.

Do not preserve French spacing rules in another locale merely to keep files visually identical.

The semantic content and key structure must match; punctuation may be localized.

## Review Workflow

For a new or modified UI feature:

1. identify every user-visible string affected by the change;
2. establish or validate the French reference wording;
3. create or update the corresponding translation keys;
4. synchronize the same key structure in `en.json`, `de.json`, and `es.json`;
5. preserve interpolation placeholders across all locales;
6. remove temporary hard-coded strings from Vue components;
7. verify the UI with each supported locale;
8. run the normal lint/build validation before considering the translation work complete.

## V2 Translation Review

Before the V2 release, perform a complete synchronization pass over:

```text
fr.json
en.json
de.json
es.json
```

The review must include the new V2 areas, especially:

- Home Assistant/Matter source selection;
- Matter commissioning;
- Matter success and error messages;
- provider/source labels;
- device catalog terminology;
- any remaining hard-coded French or English text in Vue components.

French should be reviewed first, then used to align the other three locales.

## Adding a Translation Key

When adding a key, place it in the logical section associated with the feature.

Do not create duplicate keys merely because the same wording appears in two places if the UI concept is genuinely shared.

Conversely, do not force unrelated concepts to share a key only because their current displayed text happens to be identical.

Semantic stability is more important than minimizing the number of keys.

## Adding a New Locale

A new locale requires more than copying a JSON file.

The developer must:

1. create the locale file;
2. reproduce the complete key structure;
3. import it in `homebridge-ui/src/i18n.ts`;
4. add it to `SupportedLocale`;
5. add it to browser-locale detection;
6. register it in the `messages` object;
7. review the complete UI in that language.

The fallback locale remains controlled separately by `fallbackLocale`.

## Validation Principle

A translation change is complete only when both of these are true:

```text
structural consistency
        +
semantic consistency
```

Structural consistency means the required keys and placeholders exist across supported locales.

Semantic consistency means each language communicates the same feature behavior and user instructions as the French reference.

## Related Documentation

- [`README.md`](README.md): internationalization architecture
- [`../architecture/README.md`](../architecture/README.md): plugin architecture
- [`../Matter/README.md`](../Matter/README.md): Matter V2 implementation
- [`../README.md`](../README.md): developer documentation index
