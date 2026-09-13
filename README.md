# Forever Talents

WoW Forever talent calculators, hosted on **[GitHub Pages](https://dan-in-it.github.io/ForeverTalents/)**.

All nine classes are available: **470 talents across 27 trees**.

| Class | Talents | Specializations |
| --- | ---: | --- |
| Druid | 52 | Balance, Feral Combat, Restoration |
| Hunter | 50 | Beast Mastery, Marksmanship, Survival |
| Mage | 54 | Arcane, Fire, Frost |
| Paladin | 52 | Holy, Protection, Retribution |
| Priest | 53 | Discipline, Holy, Shadow Magic |
| Rogue | 53 | Assassination, Combat, Subtlety |
| Shaman | 50 | Elemental Combat, Enhancement, Restoration |
| Warlock | 52 | Affliction, Demonology, Destruction |
| Warrior | 54 | Arms, Fury, Protection |

## Racial abilities

The homepage groups racial cards under Alliance and Horde, with links to each race. The [racial abilities page](racials.html) lists 40 abilities across ten faction/race entries, including High Order and Windshaper Skyborne. Filter by class or faction, or follow the class-specific Racials link below any calculator. All entries remain readable without JavaScript. Race and ability icons are hosted locally; Skyborne uses illustrative spell icons.

## Run locally

No installation or build step is needed:

```sh
python -m http.server 4174
```

Open `http://localhost:4174/`, or open `index.html` directly. Each calculator is a self-contained HTML file with embedded artwork and fonts for offline use.

## Calculator controls

Click to add a rank, right-click or Alt-click to refund, and Shift-click to fill available ranks. Touch users can inspect a talent and use Add rank or Remove rank. Keyboard users can Tab to a talent and use Enter, Space, or Minus.

All calculators enforce the level 10–60 point budget, five-point tier gates, and talent prerequisites. Undo, tree resets, full resets, local saving, and class-specific build codes are supported.

Tooltips display available rank effects and the next rank when known. Missing rank effects show the available rank explicitly; retained Druid estimates are labeled. Fixed costs and effect amounts are not automatically scaled.

Existing Warrior, Paladin, and Druid build-code layouts remain supported, including original WFD1 Feral builds. Shaman WFS1 codes migrate into WFS2 with Improved Healing Wave unallocated. Builds that conflict with newly added prerequisites report the problem and preserve the original save for recovery through Build code.

## Verification

```sh
node --test tests/*.test.cjs
```

Checks cover all 470 talent definitions, known rank effects, prerequisite allocation and refunds, point budgets, build-code validation, legacy imports, embedded assets, and directory links. Verify desktop, mobile, and offline behavior when changing calculator UI.

## Publishing

GitHub Pages serves the root of `main`. Pushing updates to `main` publishes the site. All local links are relative so the site works under the `/ForeverTalents/` project path.

Warcraft artwork © Blizzard Entertainment. Cinzel is distributed under the [SIL Open Font License](assets/cinzel-license.txt), also embedded in each standalone calculator. This is a community fan project, unaffiliated with Blizzard Entertainment.
