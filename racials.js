(() => {
  'use strict';
  const classFilter = document.getElementById('class-filter');
  const factionFilter = document.getElementById('faction-filter');
  const cards = [...document.querySelectorAll('.race-card')];
  const factions = [...document.querySelectorAll('.faction-section')];
  const count = items => `${items.length} ${items.length === 1 ? 'race' : 'races'} · ${items.reduce((sum, card) => sum + Number(card.dataset.abilityCount), 0)} abilities`;
  const params = new URLSearchParams(location.search);
  for (const [filter, key] of [[classFilter, 'class'], [factionFilter, 'faction']]) {
    const value = params.get(key);
    if ([...filter.options].some(option => option.value === value)) filter.value = value;
  }

  function render() {
    for (const faction of factions) {
      for (const card of faction.querySelectorAll('.race-card')) {
        card.hidden = (classFilter.value !== 'all' && !card.dataset.classes.split(' ').includes(classFilter.value)) ||
          (factionFilter.value !== 'all' && faction.dataset.faction !== factionFilter.value);
      }
      const visible = [...faction.querySelectorAll('.race-card')].filter(card => !card.hidden);
      faction.hidden = visible.length === 0;
      faction.querySelector('.faction-count').textContent = count(visible);
    }
    const visible = cards.filter(card => !card.hidden);
    document.getElementById('filter-summary').textContent = count(visible);
    document.getElementById('racial-empty').hidden = visible.length !== 0;
  }

  classFilter.addEventListener('change', render);
  factionFilter.addEventListener('change', render);
  document.getElementById('clear-filters').addEventListener('click', () => {
    classFilter.value = factionFilter.value = 'all';
    render();
  });
  document.querySelector('.racial-filters').hidden = false;
  render();
})();
