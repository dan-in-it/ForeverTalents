# Forever talent data review — September 26, 2026

Reviewed all nine classes and 27 trees against the [Wowhead Forever calculator](https://www.wowhead.com/forever/talent-calc) and [Blizzard's September 24 beta development notes](https://us.forums.blizzard.com/en/wow/t/wow-forever-beta-development-notes-%E2%80%93-updated-september-24/2360696/1). The calculators now contain **466 talents and 1,318 sourced rank descriptions**.

## Evidence and normalization

- Tree membership, names, positions, maximum ranks, descriptions at each rank, prerequisite ranks, and icons: [Wowhead's Forever calculator data](https://nether.wowhead.com/forever/data/talents-classic?dv=29&db=1790292378), retrieved September 26, 2026. The data environment is Forever, not Classic Era or Season of Discovery.
- Active spell metadata: the Forever tooltip endpoint for each talent's first spell ID, for example [Wrack](https://nether.wowhead.com/forever/tooltip/spell/1316697). Reviewed all 83 active talent tooltips. Mana percentages remain percentages; fixed costs and damage/healing values represent the source spell rank and are not scaled to the selected character level.
- `tests/fixtures/forever-source.json` records the reviewed values, Wowhead talent/tree IDs, and spell IDs. Descriptions have HTML comments and tags removed, entities decoded, and table/line boundaries preserved as readable text. No rank effects are interpolated or estimated.
- Existing form/equipment restrictions are retained where the tooltip endpoint omits them. Dual hostile/friendly ranges remain explicitly labeled. Feral Charge retains the Cat ability's separate description and cooldown.
- Current icons are embedded in each standalone calculator, preserving offline use.

## Changes by class

| Class | Talents | Principal changes |
| --- | ---: | --- |
| Druid | 51 | Removed Balance of Nature. Renamed Mangle to Primal Bite and Primal Fury to Blood Frenzy, including dependent descriptions and icons. Replaced estimated rank text with sourced values. |
| Hunter | 50 | Updated all ranks and icons; Strider Kick now includes 30% movement speed for 3 seconds. Corrected spell costs, including base-mana percentages. |
| Mage | 54 | Updated all ranks and icons; Wake of Fire lasts 30 seconds and Hot Streak lasts 20 seconds. Arcane Blast uses its base-mana percentage. |
| Paladin | 50 | Removed Improved Holy Strike and Crusade. Updated Holy Power, Light's Vigil, Vengeance, Two-Handed Weapon Specialization, Sacred Arbiter, and Twist of Light, plus the other sourced ranks and icons. |
| Priest | 53 | Updated all ranks, descriptions, icons, and spell metadata, including base-mana costs for Power Infusion and Shadowform. |
| Rogue | 53 | Replaced Restless Blades with Flawless Execution. Added prerequisites for Riposte, Dual Wield Specialization, Weapon Expertise, and Quietus; removed Aggression's old prerequisite. Updated ranks, icons, and spell metadata. |
| Shaman | 50 | Swapped Elemental Alacrity and Elemental Fury and corrected their prerequisite chain. Swapped Totemic Focus and Tidal Mastery. Rage of the Farseer grants attack speed only. Filled all rank effects, including Improved Stormstrike. |
| Warlock | 52 | Replaced Drain Hope with Wrack and updated related descriptions. Removed Conflagrate's old prerequisite. Updated all ranks, icons, and spell metadata. |
| Warrior | 53 | Removed Vitality. Applied current Bloodthrill and Improved Slam tuning. Moved Focused Rage to tier five and Bastion to tier six as documented by Blizzard. Updated ranks and icons. |

All remaining talents were compared too; the table highlights gameplay and structural changes rather than listing every corrected rank or icon. Changes to baseline spells, racial abilities, professions, and in-game bug fixes are outside this talent-calculator update.

## Source discrepancy: Warrior Protection

The fetched Wowhead data places Bastion at row 5, column 4 and Focused Rage at row 6, column 3 (one-based). Blizzard's September 24 notes explicitly say those talents exchange positions. This update follows those notes: **Focused Rage at row 5, column 4; Bastion at row 6, column 3**. This is the only deliberate tree-layout override of the fetched calculator data. It represents the documented beta change; the live client's implementation was not independently verified.

## Saved builds

The internal identity and serialization order of every surviving talent are preserved, including renamed/replaced talents. The three classes with removed slots receive new code versions: Warrior `WF2`, Paladin `WFP2`, and Druid `WFD3`.

Legacy codes import using their original slot layouts. Unallocated removed slots are skipped. Allocated removed slots are rejected with the removed talent's name; points are never silently reassigned or dropped. All imports are then checked against current tier and prerequisite rules. Original Druid Feral `WFD1` and Shaman `WFS1` formats remain supported. Local-storage keys and the existing failed-load recovery behavior remain intact.

## Verification

Run `node --test tests/*.test.cjs`. Coverage checks every talent and rank against the reviewed fixture, reachability, prerequisites, refunds, level budgets, embedded icons, and code round trips. Migration coverage exercises every surviving slot in the three changed layouts and each removed slot. Focused assertions cover September 24 tuning and the source discrepancy above.

Result: **60 tests passed**. Browser checks passed for direct left-click allocation and right-click refunds in all nine calculators, with all talent icons decoded and no script errors. Mobile touch allocation and Undo worked with a standalone file while the browser was offline. The tooltip fit a 390 × 844 viewport. A stored legacy Paladin build migrated correctly, and an invalid saved build containing a removed talent remained recoverable through Build code.

At the user's request, tooltip Add rank/Remove rank buttons were removed across all calculators. Talent icons handle allocation directly; keyboard shortcuts remain available, and touch users can reverse changes with Undo.
