# Forever Talents

A static directory of WoW Forever talent calculators, hosted on **[GitHub Pages](https://dan-in-it.github.io/ForeverTalents/)**.

Three class calculators are available: Druid with all 19 Feral Combat talents from the supplied video, Paladin with all 52 talents across Holy, Protection, and Retribution, and Warrior with all 54 talents across Arms, Fury, and Protection. **Druid Balance and Restoration remain unavailable** because their tooltips were not captured. Hunter, Mage, Priest, Rogue, Shaman, and Warlock are marked **Coming soon**.

## Run locally

No installation or build step is needed. From the repository directory:

```sh
python -m http.server 4174
```

Open `http://localhost:4174/`. The homepage also works by opening `index.html` directly. All three calculators are self-contained and can be downloaded for offline use.

The Druid calculator starts with the video's level-38, 29-point Feral build on the first visit. It supports allocation, refunds, prerequisite arrows, undo, reset, local saving, and class-specific `WFD1` build codes. **Load video build** restores the recorded allocation. Tooltip effects are labeled by their recorded rank and timestamp; missing rank values are not extrapolated. Mangle preserves the Bear-form cost and damage displayed for the recorded character.

Run the Druid allocation and reference checks with `node --test tests/druid.test.cjs`. No dependencies are required.

## Publishing

GitHub Pages serves the root of the `main` branch. The `.nojekyll` file disables Jekyll processing. Pushing updates to `main` publishes the site automatically.

All local asset and calculator links are relative so they work under the `/ForeverTalents/` project path.

## Add another calculator

1. Add the completed, self-contained HTML file to `talents/`, using a stable lowercase name such as `paladin.html`.
2. Add a link to it in the matching class card in `index.html`, and replace that card's `Coming soon` status with `Available now`. Only mark a class available once its linked file exists; name any missing specializations explicitly.
3. Update the available class count, homepage description, and this README. Keep incomplete classes visibly marked `Coming soon`.
4. Include an `All classes` link to `../` in the calculator. Verify the page and calculator at desktop and mobile widths before pushing.

Do not replace missing Forever data with talents from another version of WoW. The listed upcoming specializations are organizational placeholders, not verified Forever talent layouts.

## Sources and credits

- The Warrior calculator was imported from the supplied, completed `wow-forever-warrior.html`. Its embedded calculator notes explain the reference screenshot, rank-one descriptions, tier rules, and planning assumptions. Its allocation code is preserved.
- The Paladin calculator was imported from the completed `wow-forever-paladin.html`, with an All classes navigation link added. Its notes preserve the source-rank descriptions (including rank-three Vindication), seven prerequisite links, and the assumption that Holy Shock unlocks Divine Precision. Its allocation code is preserved.
- The Druid calculator is transcribed from `VID20260912121551.mp4` (35 seconds): Feral Combat tooltips at 0:00–0:21, tree overview at 0:03.5, and character level 38 at about 0:28. Its notes include an embedded reference still, recorded-rank handling, and planning assumptions. Four arrows are interpreted as full-rank prerequisites: Savage Fury → Mangle, Sharpened Claws → Primal Fury, Predatory Strikes → Rend and Tear, and Leader of the Pack → Berserk.
- The Druid forest artwork was created with the built-in OpenAI Image Gen tool and is saved as `assets/druid-moonlit-forest.png`, with a copy embedded in the calculator. The generation prompt is preserved in [the artwork notes](assets/druid-artwork.md).
- The homepage presents all nine classes in equal-sized cards, highlighting available calculators with matching badges, borders, and links.
- Warcraft class and ability icons are © Blizzard Entertainment, sourced from the [Wowhead icon CDN](https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg). Icons and the background are hosted locally.
- Cinzel by Natanael Gama is distributed under the [SIL Open Font License](assets/cinzel-license.txt).

This is a community fan project and is not affiliated with Blizzard Entertainment.
