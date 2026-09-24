/* Small display-only localization layer. Talent engines and saves stay in English. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.I18n = api;
})(globalThis, function (root) {
  'use strict';
  const storageKey = 'wowforever.locale';
  const locales = ['en', 'ru'];
  const dictionary = new Map();
  const originals = new WeakMap();
  let locale = 'en', observer, started = false;
  const forms = {
    talent: ['талант', 'таланта', 'талантов'], point: ['очко', 'очка', 'очков'],
    ability: ['способность', 'способности', 'способностей'], race: ['раса', 'расы', 'рас'],
    rank: ['ранг', 'ранга', 'рангов']
  };
  function plural(n, one, few, many, language = locale) {
    const value = Math.abs(Number(n));
    if (language !== 'ru') return value === 1 ? one : many;
    if (!Number.isInteger(value)) return few;
    const last = value % 10, hundred = value % 100;
    return last === 1 && hundred !== 11 ? one : last >= 2 && last <= 4 && (hundred < 12 || hundred > 14) ? few : many;
  }
  function count(n, noun, language = locale) {
    const word = language === 'ru' ? plural(n, ...forms[noun], 'ru') : Number(n) === 1 ? noun : noun === 'ability' ? 'abilities' : noun + 's';
    return `${n} ${word}`;
  }
  function resolveLocale(search = '', storage) {
    const query = new URLSearchParams(search).get('lang');
    if (locales.includes(query)) return query;
    try {
      const saved = storage?.getItem(storageKey);
      if (locales.includes(saved)) return saved;
    } catch { /* Storage may be blocked, including on file: URLs. */ }
    return 'en';
  }
  function register(values) {
    for (const [en, ru] of Object.entries(values)) if (typeof ru === 'string' && ru) dictionary.set(en, ru);
  }
  function registerTalents(source, translated) {
    for (const talent of source) {
      const entry = translated[talent.id];
      if (!entry) continue;
      for (const key of ['name', 'text', 'meta']) if (talent[key] && entry[key]) dictionary.set(talent[key], entry[key]);
      talent.rankDescriptions.forEach((value, index) => {
        if (value && entry.rankDescriptions?.[index]) dictionary.set(value, entry.rankDescriptions[index]);
      });
    }
  }
  const ru = value => translate(value, 'ru');
  const rules = [
    [/^(.+), rank (\d+) of (\d+), (maximum rank|locked|available)$/, (_, name, rank, max, status) => `${ru(name)}, ранг ${rank} из ${max}, ${ { 'maximum rank':'максимальный ранг', locked:'недоступно', available:'доступно' }[status]}`],
    [/^(.+) · Tier (\d+)$/, (_, name, tier) => `${ru(name)} · Ряд ${tier}`],
    [/^Rank (\d+) \/ (\d+)$/, (_, rank, max) => `Ранг ${rank} / ${max}`],
    [/^(AVAILABLE EFFECT|CURRENT EFFECT|NEXT RANK) · RANK (\d+)$/, (_, label, rank) => `${ { 'AVAILABLE EFFECT':'ИЗВЕСТНЫЙ ЭФФЕКТ', 'CURRENT EFFECT':'ТЕКУЩИЙ ЭФФЕКТ', 'NEXT RANK':'СЛЕДУЮЩИЙ РАНГ' }[label]} · РАНГ ${rank}`],
    [/^Rank (\d+) effect is not available\. Showing rank (\d+)\.$/, (_, rank, known) => `Описание эффекта ранга ${rank} отсутствует. Показан ранг ${known}.`],
    [/^([\s\S]+)\n\nNEXT RANK · RANK (\d+)\n([\s\S]+)$/, (_, current, rank, next) => `${ru(current)}\n\nСЛЕДУЮЩИЙ РАНГ · РАНГ ${rank}\n${ru(next)}`],
    [/^(\d+) points?$/, (_, n) => count(n, 'point', 'ru')],
    [/^(\d+) PTS$/, (_, n) => `${n} ОЧК.`],
    [/^(\d+) points required in earlier tiers$/, (_, n) => `Требуется вложить ${count(n, 'point', 'ru')} в предыдущие ряды`],
    [/^Reset (.+)$/, (_, name) => `Сбросить ветку «${ru(name)}»`],
    [/^(.+) reset\. Undo is available\.$/, (_, name) => `Ветка «${ru(name)}» сброшена. Изменение можно отменить.`],
    [/^Invalid rank for (.+)\.$/, (_, name) => `Недопустимый ранг таланта «${ru(name)}».`],
    [/^This build needs level (\d+) or higher\.$/, (_, level) => `Для этого билда требуется уровень ${level} или выше.`],
    [/^(.+) requires (\d+) points in earlier tiers\.$/, (_, name, n) => `Для таланта «${ru(name)}» требуется вложить ${count(n, 'point', 'ru')} в предыдущие ряды.`],
    [/^(.+) requires (\d+) ranks in (.+)\.$/, (_, name, rank, parent) => `Для таланта «${ru(name)}» требуется ранг ${rank} таланта «${ru(parent)}».`],
    [/^Requires (\d+) ranks in (.+)\.$/, (_, rank, name) => `Требуется ранг ${rank} таланта «${ru(name)}».`],
    [/^Spend (\d+) more points in earlier tiers of this tree\.$/, (_, n) => `Вложите еще ${count(n, 'point', 'ru')} в предыдущие ряды этой ветки.`],
    [/^(.+) Refund points first\.$/, (_, error) => `${ru(error)} Сначала верните очки талантов.`],
    [/^Saved build needs attention: ([\s\S]+) The original save is preserved\.$/, (_, error) => {
      const message = ru(error);
      return `Не удалось загрузить сохраненный билд: ${message === error ? 'локальное хранилище недоступно или данные повреждены.' : message} Исходное сохранение не изменено.`;
    }],
    [/^Paste a valid (.+) build code\.$/, (_, type) => `Вставьте корректный код билда: ${translateCodeType(type)}.`],
    [/^Paste a valid WFD2 Druid build code or an original WFD1 Feral code\.$/, () => 'Вставьте корректный код билда друида WFD2 или исходный код WFD1 ветки «Сила зверя».'],
    [/^(\d+) races? · (\d+) abilities(?: · (\d+) racials TBD)?$/, (_, races, abilities, pending) => `${count(races, 'race', 'ru')} · ${count(abilities, 'ability', 'ru')}${pending ? ` · расовые способности пока неизвестны: ${count(pending, 'race', 'ru')}` : ''}`]
  ];
  function translateCodeType(type) {
    return type.replace(/Druid|Hunter|Mage|Paladin|Priest|Rogue|Shaman|Warlock|Warrior/g, value => ru(value)).replace(/ or /g, ' или ');
  }
  function translate(value, language = locale) {
    const source = String(value);
    if (language !== 'ru' || !source.trim()) return source;
    const text = source.trim();
    let translated = dictionary.get(text);
    if (translated === undefined) {
      for (const [pattern, render] of rules) {
        const match = text.match(pattern);
        if (match) { translated = render(...match); break; }
      }
    }
    if (translated === undefined && text.includes('\n')) {
      translated = text.split('\n').map(line => translate(line, language)).join('\n');
    }
    if (translated === undefined) return source;
    return source.slice(0, source.indexOf(text)) + translated + source.slice(source.indexOf(text) + text.length);
  }
  function update(target, key, get, set) {
    let entries = originals.get(target);
    if (!entries) { entries = new Map(); originals.set(target, entries); }
    const current = get();
    let entry = entries.get(key);
    if (!entry || current !== entry.rendered) entry = {source: current};
    entry.rendered = translate(entry.source);
    entries.set(key, entry);
    if (current !== entry.rendered) set(entry.rendered);
  }
  function localize(node) {
    if (node.nodeType === 3) {
      if (!node.parentElement?.closest('script, style, textarea, code, noscript, [data-i18n-ignore]'))
        update(node, 'text', () => node.nodeValue, value => { node.nodeValue = value; });
      return;
    }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      if (node.matches('script, style, textarea, code, noscript, [data-i18n-ignore]')) return;
      for (const attr of ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']) {
        if (node.hasAttribute(attr)) update(node, attr, () => node.getAttribute(attr), value => node.setAttribute(attr, value));
      }
      if (node.matches('meta[name="description"]')) update(node, 'content', () => node.content, value => { node.content = value; });
    }
    for (const child of node.childNodes) localize(child);
  }
  function syncLinks() {
    for (const link of root.document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(href)) continue;
      const [pathQuery, hash] = href.split('#');
      const [path, query] = pathQuery.split('?');
      const params = new URLSearchParams(query);
      params.set('lang', locale);
      const next = path + '?' + params + (hash === undefined ? '' : '#' + hash);
      if (href !== next) link.setAttribute('href', next);
    }
  }
  function refresh() {
    if (!root.document) return;
    localize(root.document.documentElement);
    root.document.documentElement.lang = locale;
    for (const button of root.document.querySelectorAll('[data-locale]')) button.setAttribute('aria-pressed', String(button.dataset.locale === locale));
    syncLinks();
  }
  function setLocale(next, persist = true) {
    locale = locales.includes(next) ? next : 'en';
    let saved = true;
    if (persist) {
      try { root.localStorage.setItem(storageKey, locale); } catch { saved = false; }
      // Preserve class/faction filters, hashes and deployment prefix.
      try {
        const url = new URL(root.location.href);
        url.searchParams.set('lang', locale);
        root.history.replaceState(null, '', url);
      } catch { /* file: browsers may disallow history replacement. */ }
    }
    refresh();
    const status = root.document?.querySelector('[data-language-status]');
    if (status) status.textContent = saved ? '' : translate('Language preference could not be saved.');
    return locale;
  }
  function start() {
    if (started || !root.document) return;
    started = true;
    let storage;
    try { storage = root.localStorage; } catch {}
    locale = resolveLocale(root.location.search, storage);
    const header = root.document.querySelector('.masthead, .site-header');
    const controls = root.document.createElement('div');
    controls.setAttribute('data-language-switch', '');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Language');
    for (const [language, title] of [['en', 'English'], ['ru', 'Russian']]) {
      const button = root.document.createElement('button');
      button.type = 'button'; button.dataset.locale = language;
      button.textContent = language.toUpperCase(); button.title = title;
      button.addEventListener('click', () => setLocale(language));
      controls.append(button);
    }
    const status = root.document.createElement('span');
    status.setAttribute('data-language-status', ''); status.setAttribute('role', 'status');
    controls.append(status);
    header?.after(controls);
    refresh();
    observer = new root.MutationObserver(records => {
      const nodes = new Set();
      for (const record of records) {
        if (record.type === 'childList') for (const node of record.addedNodes) nodes.add(node);
        else nodes.add(record.target);
      }
      for (const node of nodes) if (node.isConnected) localize(node);
    });
    observer.observe(root.document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true,
      attributeFilter:['aria-label', 'aria-description', 'title', 'alt', 'placeholder', 'content']});
    root.addEventListener('popstate', () => {
      let storage;
      try { storage = root.localStorage; } catch {}
      setLocale(resolveLocale(root.location.search, storage), false);
    });
  }
  return {locales, storageKey, register, registerTalents, translate, plural, count, resolveLocale, setLocale, start, refresh, get locale() { return locale; }};
});
