# Forever Talents

A static directory of WoW Forever talent calculators, hosted on **[GitHub Pages](https://dan-in-it.github.io/ForeverTalents/)**.

Warrior is available with all 54 talents across Arms, Fury, and Protection. Druid, Hunter, Mage, Paladin, Priest, Rogue, Shaman, and Warlock are marked **Coming soon**.

## Run locally

No installation or build step is needed. From the repository directory:

```sh
python -m http.server 4174
```

Open `http://localhost:4174/`. The homepage also works by opening `index.html` directly. The Warrior calculator is self-contained and can be downloaded for offline use.

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
- The homepage's battlefield artwork reuses the Warrior calculator's OpenAI Image Gen background.
- Warcraft class and ability icons are © Blizzard Entertainment, sourced from the [Wowhead icon CDN](https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg). Icons and the background are hosted locally.
- Cinzel by Natanael Gama is distributed under the [SIL Open Font License](assets/cinzel-license.txt).

This is a community fan project and is not affiliated with Blizzard Entertainment.
