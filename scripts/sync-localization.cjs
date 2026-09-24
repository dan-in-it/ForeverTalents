// Optional maintainer command; the site itself never needs a build step.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const marker = '<!-- Localization bundle: source files at repository root; see docs/localization/README.md. -->';
for (const file of fs.readdirSync(path.join(root, 'talents')).filter(file => file.endsWith('.html'))) {
  const destination = path.join(root, 'talents', file);
  let html = fs.readFileSync(destination, 'utf8');
  const start = html.indexOf(marker);
  if (start !== -1) html = html.slice(0, start) + html.slice(html.indexOf('</body>', start));
  const sources = ['i18n.js', 'locales/ru.js', `locales/ru-${file.slice(0, -5)}.js`];
  const scripts = sources.map(source => `<script data-i18n-bundle="${source}">\n${fs.readFileSync(path.join(root, source), 'utf8')}</script>`).join('\n');
  const css = fs.readFileSync(path.join(root, 'i18n.css'), 'utf8');
  const bundle = `${marker}\n<style data-i18n-bundle="i18n.css">\n${css}</style>\n${scripts}\n<script>I18n.start();</script>\n`;
  fs.writeFileSync(destination, html.replace('</body>', bundle + '</body>'));
}
