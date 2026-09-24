# Localization

English is the source/default locale; Russian is an additional display locale. No server, package installation, build step, fetch requests or framework is needed to use the site.

## Architecture

- `i18n.js` owns locale resolution, EN/RU controls, English fallback, Russian plural forms, and the display adapter.
- `locales/ru.js` contains shared UI, directory, racial, accessibility and metadata strings. English source strings are its keys.
- `locales/ru-<class>.js` contains only `name`, `text`, `rankDescriptions` and optional `meta`, keyed by the **existing talent ID**. No mechanics are copied into these dictionaries.
- The original `TALENTS`, `treeInfo`, calculator script, engine, build encoders/decoders and `racials.js` stay unchanged. `registerTalents` pairs known English text with Russian text without mutating either source data or rank arrays.
- The display adapter translates text nodes and the allowlisted `aria-label`, `aria-description`, `title`, `alt`, `placeholder` and description-meta attributes. It never rewrites `innerHTML`, IDs, classes, image sources, form values, talent arrays or build codes. A `MutationObserver` translates dynamic UI updates in the same microtask checkpoint; it watches only changed nodes/allowlisted attributes.
- Original text is retained in a `WeakMap`. Switching languages restores English and preserves current allocation, undo history, open dialogs and input values. `null` ranks stay `null`; estimates stay labeled as estimates.
- Explicit valid `?lang=en|ru` takes precedence over `localStorage['wowforever.locale']`, then defaults to English. The switch persists the preference, preserves other query parameters/hash, and propagates the locale in relative navigation links. Existing build storage keys are untouched. Blocked storage does not prevent switching; the control reports a localized message.
- `plural(n, one, few, many, locale)` implements Russian forms including 11–14 and 21–24. `count` supplies forms for talent, point, ability, race and rank. Missing dictionary entries retain their English text.

The homepage and racials page load two local scripts and a stylesheet. Each calculator embeds the same runtime, stylesheet, common dictionary and its class dictionary, preserving the existing **single HTML file** offline contract. No remote fonts/assets or requests were added.

## Editing translations

Edit canonical files in `locales/` or `i18n.js` / `i18n.css`, then run:

```sh
node scripts/sync-localization.cjs
node --test tests/*.test.cjs
```

The sync script is a maintainer convenience, not a site build requirement: generated bundles are checked in. It replaces only the marked localization bundle at the end of each calculator. Tests fail if any embedded copy diverges from its canonical source.

Translate each effect against its actual Forever source. Do not import an older WoW tooltip as a substitute for Forever mechanics. Known ranks are individually stored; there is no runtime scaling, number inference or automated translation. In particular, retain any unknown ranks, estimates, fixed costs, limitations and number formatting. A future missing translation deliberately falls back to English.

## Inventory

Tests extract static strings directly from the HTML and verify all 470 talent records, including all 732 non-null rank descriptions. Brand names (`Forever Talents`, `WoW`, `Warcraft`, `Blizzard Entertainment`, `GitHub`), keyboard keys and technical build-code prefixes keep their spelling.

| UI surface | Strings covered |
| --- | --- |
| Directory | Headings, class/spec labels, summaries, class and race links, status, footer |
| Racials | Ten race/faction entries, 40 ability entries, effects, active/passive labels, playable classes, filters, empty state, live counts |
| Calculator | Class headlines, tree headings/subtitles, toolbar, level, point counters, legends, reset and undo |
| Tooltip | Name, all known rank effects, cost/range/cooldown/form requirements, next-rank preview, missing/estimated rank notes, availability, tier, add/remove |
| Build dialog | Headings, input labels, import/copy controls, success/error/copy-selection messages |
| Guide | Mouse, touch and keyboard controls, save/undo/import guidance, offline explanation |
| Engine messages (display only) | Invalid ranks/layouts/codes, level budgets, previous-tier requirements, prerequisites, maximum rank, unavailable refunds |
| Storage | Saved/unavailable status, preserved damaged save, recovery guidance, preference write failure |
| Accessibility/metadata | `html.lang`, title, meta description, skip links, aria labels, status regions, tooltip controls, dynamic rank/state labels |

Dynamic message patterns are explicitly listed in `i18n.js` under `rules` and covered in `tests/localization.test.cjs`. They are not substring replacements of arbitrary talent text.

## Verification

`node --test tests/*.test.cjs` requires only Node. Original tests cover all classes, prerequisites, point budgets, original WFD1 Feral import, WFS1 migration, and build-code rejection. Localization tests additionally check:

- locale resolution, switching, persistence, fallback, URL preservation and plural forms;
- complete static and talent translation coverage;
- numeric tokens, percent counts, ID order, rank lengths and `null` positions;
- SHA-256 of the **entire original calculator script**, including talent definitions, assets, storage keys and engine (including original line endings);
- dynamic status/errors/accessibility and embedded bundle consistency.

Optional real-browser suite (Playwright is a testing tool only, not a site dependency):

```sh
NODE_PATH=/path/to/playwright/node_modules node tests/localization.browser.cjs
```

The suite uses Playwright Chromium by default; `FT_BROWSER` can select another Chromium-family executable. `FT_SCREENSHOTS` selects output directory. The suite starts its own local server under `/ForeverTalents/`, visits all calculators at 1440×1000 and touch 390×844, inspects every rank tooltip, checks English leakage (including hidden dialog text/aria/meta), import/undo/reload, filters, blocked storage, and network-disabled `file://` pages. Standalone calculator copies are tested in a temporary directory without sibling files.

Naming decisions, sources and the human review list are in [ru-glossary.md](ru-glossary.md).
