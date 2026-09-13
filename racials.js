'use strict';

const classFilter = document.getElementById('class-filter');
const factionFilter = document.getElementById('faction-filter');
const clearFilters = document.getElementById('clear-filters');
const sections = [...document.querySelectorAll('.faction-section')];

function readFilters() {
  const params = new URLSearchParams(location.search);
  for (const [key, control] of [['class', classFilter], ['faction', factionFilter]]) {
    const value = params.get(key);
    control.value = [...control.options].some(option => option.value === value) ? value : 'all';
  }
}

function applyFilters(updateUrl = false) {
  let raceCount = 0;
  let abilityCount = 0;
  let pendingCount = 0;
  for (const section of sections) {
    let factionRaces = 0;
    let factionAbilities = 0;
    for (const card of section.querySelectorAll('.race-card')) {
      card.hidden = (classFilter.value !== 'all' && !card.dataset.classes.split(' ').includes(classFilter.value)) ||
        (factionFilter.value !== 'all' && section.dataset.faction !== factionFilter.value);
      if (!card.hidden) {
        const abilities = Number(card.dataset.abilityCount);
        factionRaces++;
        factionAbilities += abilities;
        if (!abilities) pendingCount++;
      }
    }
    section.hidden = factionRaces === 0;
    section.querySelector('.faction-count').textContent = `${factionRaces} ${factionRaces === 1 ? 'race' : 'races'} · ${factionAbilities} abilities`;
    raceCount += factionRaces;
    abilityCount += factionAbilities;
  }
  document.getElementById('filter-summary').textContent = `${raceCount} ${raceCount === 1 ? 'race' : 'races'} · ${abilityCount} abilities${pendingCount ? ` · ${pendingCount} racials TBD` : ''}`;
  document.getElementById('racial-empty').hidden = raceCount !== 0;
  clearFilters.disabled = classFilter.value === 'all' && factionFilter.value === 'all';
  if (updateUrl && location.protocol !== 'file:') {
    const url = new URL(location.href);
    for (const [key, control] of [['class', classFilter], ['faction', factionFilter]]) {
      if (control.value === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, control.value);
    }
    // A filter may hide the previously linked race.
    url.hash = '';
    history.replaceState(null, '', url);
  }
}

classFilter.addEventListener('change', () => applyFilters(true));
factionFilter.addEventListener('change', () => applyFilters(true));
clearFilters.addEventListener('click', () => {
  classFilter.value = 'all';
  factionFilter.value = 'all';
  applyFilters(true);
});
window.addEventListener('popstate', () => { readFilters(); applyFilters(); });
readFilters();
applyFilters();
document.querySelector('.racial-filters').hidden = false;
