# Forever Talents

WoW Forever talent calculators, hosted on **[GitHub Pages](https://dan-in-it.github.io/ForeverTalents/)**.

All nine classes are available: **466 talents across 27 trees**, reviewed against Wowhead's Forever data and Blizzard's October 1 beta notes on October 1, 2026. See the [current talent data review](docs/talent-review-2026-10-01.md) for class changes, source discrepancies, and saved-build compatibility.

| Class | Talents | Specializations |
| --- | ---: | --- |
| Druid | 52 | Balance, Feral Combat, Restoration |
| Hunter | 50 | Beast Mastery, Marksmanship, Survival |
| Mage | 54 | Arcane, Fire, Frost |
| Paladin | 50 | Holy, Protection, Retribution |
| Priest | 53 | Discipline, Holy, Shadow Magic |
| Rogue | 53 | Assassination, Combat, Subtlety |
| Shaman | 50 | Elemental Combat, Enhancement, Restoration |
| Warlock | 52 | Affliction, Demonology, Destruction |
| Warrior | 52 | Arms, Fury, Protection |

## Racial abilities

The homepage groups racial cards under Alliance and Horde, with links to each race. The [racial abilities page](racials.html) lists 40 abilities across ten faction/race entries, including High Order and Windshaper Skyborne. Filter by class or faction, or follow the class-specific Racials link below any calculator. All entries remain readable without JavaScript. Race and ability icons are hosted locally; Skyborne uses illustrative spell icons.

## Run locally

No installation or build step is needed:

```sh
python -m http.server 4174
```

Open `http://localhost:4174/`, or open `index.html` directly. Each calculator is a self-contained HTML file with embedded artwork and fonts for offline use.

## Calculator controls

Click to add a rank, right-click or Alt-click to refund, and Shift-click to fill available ranks. Touch users tap a talent to add a rank and use Undo to reverse a change. Keyboard users can Tab to a talent and use Enter, Space, or Minus.

All calculators enforce the level 10–60 point budget, five-point tier gates, and talent prerequisites. Undo, tree resets, full resets, local saving, and class-specific build codes are supported.

Tooltips display sourced effects for every talent rank, including the next rank. Spell costs, ranges, cast times, and cooldowns come from the Forever spell tooltips. Base-mana costs retain their percentage instead of a character-specific estimate. Damage and healing values are source tooltip values, not a simulation of character stats or higher trained spell ranks.

Warrior WF1/WF2 codes import into WF3, Druid WFD1/WFD2/WFD3 codes import into WFD4, and Paladin WFP1 codes import into WFP2. Surviving talents retain their identities, including Iron Will moving from Fury to Protection. Newly added talents start unallocated. Codes with points in removed talents (including King of the Jungle, Improved Cleave, Boundless Rage, Precision, and Toughness) report the removed talent instead of silently reallocating points. Shaman WFS1 codes migrate into WFS2 with Improved Healing Wave unallocated. Builds that conflict with updated tiers or prerequisites report the problem and preserve the original save for recovery through Build code. Simple renames such as Heating Up and Soul Harvest retain their build-code slots.

## Verification

```sh
node --test tests/*.test.cjs
```

Checks cover all 466 talent definitions and 1,314 rank effects, prerequisite allocation and refunds, point budgets, build-code validation, legacy imports and removed talents, embedded assets, and directory links. Verify desktop, mobile, and offline behavior when changing calculator UI.

## Publishing

GitHub Pages serves the root of `main`. Pushing updates to `main` publishes the site. All local links are relative so the site works under the `/ForeverTalents/` project path.

Warcraft artwork © Blizzard Entertainment. Cinzel is distributed under the [SIL Open Font License](assets/cinzel-license.txt), also embedded in each standalone calculator. This is a community fan project, unaffiliated with Blizzard Entertainment.
