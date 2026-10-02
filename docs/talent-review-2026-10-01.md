# Forever talent data review — October 1, 2026

Reviewed all nine classes and 27 trees against the [Wowhead Forever calculator](https://www.wowhead.com/forever/talent-calc), [Blizzard's October 1 development notes](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-october-1/2360696/4), and [Blizzard's additional Warrior changes](https://us.forums.blizzard.com/en/wow/t/warrior-updates-in-todays-beta-build/2369360/1). The latter post is dated October 2 UTC, October 1 in America/Los_Angeles.

The calculators contain **466 talents and 1,314 rank descriptions**. The total talent count is unchanged: Druid gains one net talent and Warrior loses one.

## Sources and coverage

- Retrieved the [current Forever talent dataset](https://nether.wowhead.com/forever/data/talents-classic?dv=29&db=1790897736) linked by Wowhead's calculator. Compared every talent's name, tree, row, column, ranks, effects, prerequisites, spell IDs, and icon against the September 26 snapshot.
- Checked the Forever tooltip endpoints for all active talents, including [Shifting Power](https://nether.wowhead.com/forever/tooltip/spell/1322605), [Sniper Shot](https://nether.wowhead.com/forever/tooltip/spell/1310687), and [Spearing Strike](https://nether.wowhead.com/forever/tooltip/spell/1310222). Preserved explicit friendly/enemy ranges and form/equipment restrictions where endpoint formatting omits them.
- Updated `tests/fixtures/forever-source.json` with the normalized, reviewed result. HTML comments and tags are removed; table and line boundaries remain readable. New icons are embedded for standalone use.
- Reviewed baseline changes and bug fixes for context. The calculator models talent allocation and displays talent effects; it does not simulate combat, baseline spells, or character-stat scaling. The temporary beta level cap does not change the level-60 build planner.

## Changes by class

| Class | Talents | Changes since September 26 |
| --- | ---: | --- |
| Druid | 52 | Removed King of the Jungle; added Shifting Power and Improved Shifting Power. Shredding Attacks moves to row 3 and starts their prerequisite chain. Predatory Instincts moves to column 4. Updated Primal Bite threat text and source wording for Moonkin Form and Feral Charge. |
| Hunter | 50 | Sniper Shot has a 45-yard maximum range and extends the next three shots. Deflection now grants 1–5% Parry. Updated Improved Stings and Predator's Edge icons and current tooltip wording. |
| Mage | 54 | Renamed Hot Streak to Heating Up and updated its icon/effect text. Combustion ends after three qualifying critical strikes. |
| Paladin | 50 | Updated Redoubt, Holy Shield, and Champion of the Light tuning. Refreshed Voice of Truth, Light's Vigil, Iron Creed, and Twist of Light wording. |
| Priest | 53 | Inner Focus excludes periodic spells. Spirit Tap now describes the Vampiric Embrace death trigger; refreshed Vampiric Embrace and Devouring Contagion text. |
| Rogue | 53 | Setup requires dodging/resisting the current target's attack/spell. Updated Venom wording. |
| Shaman | 50 | All talents and active metadata checked; no talent-data changes after normalization. |
| Warlock | 52 | Renamed Soul Harvesting to Soul Harvest and updated its qualifying kill and regeneration wording. Refreshed Wrack wording. |
| Warrior | 52 | Added Lingering Rage, Furious Precision, and Gore Drinker. Removed Improved Cleave, Boundless Rage, Precision, and Toughness. Moved Iron Will to Protection and applied the Fury/Protection layout and dependency changes. Updated tuning, Spearing Strike's stance requirement, and Improved Slam's first-rank cooldown reduction. |

## Source discrepancies resolved

The following are explicit overrides of the fetched calculator descriptions, based on Blizzard's notes:

| Talent | Fetched data | Applied result |
| --- | --- | --- |
| Shifting Power | Description says “0 Mana”; tooltip cost is 55% of base mana. | Description and metadata both use 55% of base mana; 40 Energy, 16-second cooldown, Cat Form requirement. |
| Raging Blows | Off-hand Whirlwind effect and 2-Rage Cleave reduction. | Cleave and Whirlwind cost 3 less Rage; removed the now-baseline off-hand effect. |
| Bloodthirst | 35% Attack Power. | 45% Attack Power; other sourced effect text retained. |
| Warrior Dual Wield Specialization | Calculator descriptions grant 10–50% extra off-hand Rage; the spell endpoint instead still grants hit chance. | Retained 5–25% off-hand damage only, following the main notes' removal of bonus Rage and the additional Warrior notes' removal of hit chance. This source conflict is not independently verified in the beta client. |

All current tree positions follow the fetched dataset. It now places Focused Rage at row 5, column 3 and Bastion at row 6, column 3, superseding the September 26 layout override. Improved Slam's first rank reduces its cooldown by 3 seconds in the current data; the other first/second-rank effects remain distinct.

## Saved builds

Warrior now exports `WF3`; Druid exports `WFD4`. `WF1`, `WF2`, `WFD1`, `WFD2`, and `WFD3` remain readable using their original layouts. The September 26 layouts are retained in `tests/fixtures/september-26-layouts.json`; earlier snapshots remain unchanged.

Wowhead reused the old King of the Jungle, Iron Will, and Boundless Rage IDs for different talents. New talents therefore receive separate internal IDs. Iron Will keeps its original internal identity when moving trees, while new Fury and Feral talents start empty. Allocated removed talents reject with their names. Imports invalidated by a moved talent or a changed prerequisite reject with the specific requirement; saved code remains available for recovery. Renames preserve existing slots and code versions.

## Verification

`node --test --test-reporter=tap tests/*.test.cjs`: **69 passed, 0 failed**. Coverage includes all 466 definitions, all 1,314 ranks, talent reachability, prerequisites/refunds, budgets, current code round trips, every surviving legacy slot, removed-slot rejection, and the October 1 changes and overrides.

Browser checks cover the new Druid prerequisite chain, Warrior allocation/refunds, embedded icon decoding, prerequisite arrows, and desktop layouts. Shifting Power's tooltip fits a 390 × 844 mobile viewport with network requests disabled. Standalone pages use embedded assets. Existing design and profession work is preserved.
