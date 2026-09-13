# Forever Talents

A static directory of WoW Forever talent calculators, hosted on **[GitHub Pages](https://dan-in-it.github.io/ForeverTalents/)**.

Four class calculators are available: Druid with all 19 Feral Combat talents from the supplied video, Paladin with all 52 talents across Holy, Protection, and Retribution, Shaman with all 49 talents across Elemental (16), Enhancement (18), and Restoration (15), and Warrior with all 54 talents across Arms, Fury, and Protection. **Druid Balance and Restoration remain unavailable** because their tooltips were not captured. Hunter, Mage, Priest, Rogue, and Warlock are marked **Coming soon**.

## Run locally

No installation or build step is needed. From the repository directory:

```sh
python -m http.server 4174
```

Open `http://localhost:4174/`. The homepage also works by opening `index.html` directly. All four calculators are self-contained and can be downloaded for offline use.

The Druid calculator starts with the video's level-38, 29-point Feral build on the first visit. It supports allocation, refunds, prerequisite arrows, undo, reset, local saving, and class-specific `WFD1` build codes. **Load video build** restores the recorded allocation. Tooltip effects are labeled by their recorded rank and timestamp; missing rank values are not extrapolated. Mangle preserves the Bear-form cost and damage displayed for the recorded character.

Run the Druid allocation and reference checks with `node --test tests/druid.test.cjs`. No dependencies are required.

Run the Shaman allocation and build-code checks with `node --test tests/shaman.test.cjs`.

## Publishing

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file disables Jekyll processing. Pushing updates to `main` publishes the site automatically.

All local asset and calculator links are relative so they work under the `/ForeverTalents/` project path.

## Racial abilities

The homepage includes a separate, responsive racial grid beneath the class calculators, grouped under Alliance and Horde headings. Each faction has four race cards previewing their abilities and a Skyborne card marked TBD. All ten cards link directly to the matching race and faction in the reference.

The [racial reference](racials.html) includes all 32 abilities from [nikftw’s Forever calculator](https://nikftw.github.io/forevertalent/), with active/passive labels and playable classes. Filter by class and faction, or open the class-filtered reference from any available calculator. Both Skyborne faction entries are included with racials marked **TBD**, as in the source. All descriptions remain readable without JavaScript; filters require JavaScript. Icons are hosted locally.

Data was captured September 12, 2026 from [`src/data/racials.json` at source revision `8d56de3`](https://github.com/nikftw/forevertalent/blob/8d56de397500960eabdbf2bf1a83299697cee278/src/data/racials.json), checked against the deployed site's data. Ability names, descriptions, active/passive flags, and race/class combinations are preserved, including the source's Troll entries. The source does not specify every numerical value or cooldown; missing values have not been inferred.

## Add another calculator

1. Add the completed, self-contained HTML file to `talents/`, using a stable lowercase name such as `paladin.html`.
2. Add a link to it in the matching class card in `index.html`, and replace that card's `Coming soon` status with `Available now`. Only mark a class available once its linked file exists; name any missing specializations explicitly.
3. Update the available class count, homepage description, and this README. Keep incomplete classes visibly marked `Coming soon`.
4. Include an `All classes` link to `../` in the calculator. Verify the page and calculator at desktop and mobile widths before pushing.

Do not replace missing Forever data with talents from another version of WoW. The listed upcoming specializations are organizational placeholders, not verified Forever talent layouts.

## Sources and credits

- The Warrior calculator was imported from the supplied, completed `wow-forever-warrior.html`. Its embedded calculator notes explain the reference screenshot, rank-one descriptions, tier rules, and planning assumptions. Its allocation code is preserved.
- The Shaman calculator transcribes the supplied Forever screenshot, including all 49 talent names, rank limits, positions, and rank-one descriptions. It reuses the Warrior allocation controls, with separate Shaman storage and `WFS1` build codes. Its embedded notes disclose the assumed level 10–60 point budget and five-point tier gates; individual prerequisite links and higher-rank effects are not established by the screenshot.
- Shaman background artwork was created with the built-in OpenAI Image Gen tool; see [the saved prompt](assets/shaman-artwork.md).
- The Paladin calculator was imported from the completed `wow-forever-paladin.html`, with an All classes navigation link added. Its notes preserve the source-rank descriptions (including rank-three Vindication), seven prerequisite links, and the assumption that Holy Shock unlocks Divine Precision. Its allocation code is preserved.
- The Druid calculator is transcribed from `VID20260912121551.mp4` (35 seconds): Feral Combat tooltips at 0:00–0:21, tree overview at 0:03.5, and character level 38 at about 0:28. Its notes include an embedded reference still, recorded-rank handling, and planning assumptions. Four arrows are interpreted as full-rank prerequisites: Savage Fury → Mangle, Sharpened Claws → Primal Fury, Predatory Strikes → Rend and Tear, and Leader of the Pack → Berserk.
- The Druid forest artwork was created with the built-in OpenAI Image Gen tool and is saved as `assets/druid-moonlit-forest.png`, with a copy embedded in the calculator. The generation prompt is preserved in [the artwork notes](assets/druid-artwork.md).
- The homepage presents all nine classes in equal-sized cards, highlighting available calculators with matching badges, borders, and links.
- Warcraft class and ability icons are © Blizzard Entertainment, sourced from the [Wowhead icon CDN](https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg). Icons and the background are hosted locally.
- Cinzel by Natanael Gama is distributed under the [SIL Open Font License](assets/cinzel-license.txt).

This is a community fan project and is not affiliated with Blizzard Entertainment.
