import fs from 'node:fs';
import path from 'node:path';
import facts from '../i18n/facts.mjs';
import registry from '../i18n/registry.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const locales = Object.fromEntries(await Promise.all(Object.keys(registry.locales).map(async (locale) => {
  const mod = await import(`../i18n/locales/${locale}.mjs`);
  return [locale, mod.default];
})));
const tokenPattern = /{{(text|attr|json|js|fact|factAttr|factJson|factJs|options):([A-Za-z0-9_.-]+)}}/g;
const vehicleTokenPattern = /{{vehicles}}/g;

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function write(file, body) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
}
function lookup(obj, dotted) {
  return dotted.split('.').reduce((node, part) => (node && Object.prototype.hasOwnProperty.call(node, part) ? node[part] : undefined), obj);
}
function requireLocale(locale, key) {
  const value = locales[locale]?.[key];
  if (typeof value !== 'string') throw new Error(`Missing ${locale} translation: ${key}`);
  if (value.trim() === '') throw new Error(`Empty ${locale} translation: ${key}`);
  return value;
}
function requireFact(key) {
  const value = lookup(facts, key);
  if (value === undefined || value === null) throw new Error(`Missing fact: ${key}`);
  if (typeof value === 'object') throw new Error(`Fact token resolved to object: ${key}`);
  return String(value);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
function escapeJsonInner(value) {
  return JSON.stringify(String(value)).slice(1, -1);
}
function escapeJsInner(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/<\/script/gi, '<\\/script');
}
function countryKey(name) {
  return `countries.${name.replace(/[^A-Za-z0-9]+/g, '.').replace(/^\.|\.$/g, '')}`;
}
function renderOptions(kind, locale) {
  if (kind === 'countries') {
    const lines = [
      '<option value="">' + escapeHtml(requireLocale(locale, 'form.country.placeholder')) + '</option>',
      '<option value="Japan (Okinawa Local)">' + escapeHtml(requireLocale(locale, 'form.country.japanLocal')) + '</option>',
    ];
    for (const group of facts.countryGroups) {
      lines.push(`<optgroup label="${escapeAttr(requireLocale(locale, group.labelKey))}">`);
      for (const country of group.countries) {
        const value = country === 'United States' ? 'USA' : country;
        lines.push(`<option value="${escapeAttr(value)}">${escapeHtml(requireLocale(locale, countryKey(country)))}</option>`);
      }
      lines.push('</optgroup>');
    }
    lines.push('<option value="Other">' + escapeHtml(requireLocale(locale, 'form.country.other')) + '</option>');
    return lines.join('\n                  ');
  }
  if (kind === 'purposes') {
    return [
      '<option value="">' + escapeHtml(requireLocale(locale, 'form.purpose.placeholder')) + '</option>',
      ...facts.form.purposes.map((purpose) => `<option value="${escapeAttr(purpose.value)}">${escapeHtml(requireLocale(locale, purpose.labelKey))}</option>`),
    ].join('\n                  ');
  }
  throw new Error(`Unknown options token: ${kind}`);
}
function renderVehicleMedia(vehicle) {
  if (!vehicle.media || typeof vehicle.media !== 'object') throw new Error(`Vehicle ${vehicle.id} missing media`);
  if (vehicle.media.type === 'emoji') return escapeHtml(vehicle.media.value);
  if (vehicle.media.type === 'image') {
    const imagePath = String(vehicle.media.value || '');
    if (!imagePath || !fs.existsSync(path.join(root, imagePath))) throw new Error(`Vehicle ${vehicle.id} image not found: ${imagePath}`);
    return `<img src="${escapeAttr(imagePath)}" alt="${escapeAttr(vehicle.brand + ' ' + vehicle.model)}">`;
  }
  throw new Error(`Vehicle ${vehicle.id} has unsupported media type: ${vehicle.media.type}`);
}
function validateVehicle(vehicle, seenIds) {
  for (const field of ['id', 'brand', 'model', 'categoryKey']) {
    if (typeof vehicle[field] !== 'string' || vehicle[field].trim() === '') throw new Error(`Vehicle missing ${field}`);
  }
  for (const forbidden of ['year', 'mileage', 'colorKey', 'statusKey']) {
    if (Object.prototype.hasOwnProperty.call(vehicle, forbidden)) throw new Error(`Example vehicle ${vehicle.id} must not define ${forbidden}`);
  }
  if (seenIds.has(vehicle.id)) throw new Error(`Duplicate vehicle id: ${vehicle.id}`);
  seenIds.add(vehicle.id);
  for (const locale of Object.keys(locales)) {
    requireLocale(locale, vehicle.categoryKey);
    requireLocale(locale, 'vehicle.cta.sourceModel');
  }
}
function renderVehicles(locale) {
  const seenIds = new Set();
  return Object.values(facts.vehicles).map((vehicle) => {
    validateVehicle(vehicle, seenIds);
    return `<article class="vehicle-card">
      <div class="vehicle-img">${renderVehicleMedia(vehicle)}</div>
      <div class="vehicle-body">
        <div class="vehicle-make">${escapeHtml(vehicle.brand)}</div>
        <h3 class="vehicle-name">${escapeHtml(vehicle.model)}</h3>
        <p class="vehicle-category">${escapeHtml(requireLocale(locale, vehicle.categoryKey))}</p>
        <a class="vehicle-status" href="#contact">${escapeHtml(requireLocale(locale, 'vehicle.cta.sourceModel'))}</a>
      </div>
    </article>`;
  }).join('\n    ');
}
function resolveToken(type, key, locale) {
  if (type === 'options') return renderOptions(key, locale);
  const isFact = type.startsWith('fact');
  const value = isFact ? requireFact(key) : requireLocale(locale, key);
  if (type === 'text' || type === 'fact') return escapeHtml(value);
  if (type === 'attr' || type === 'factAttr') return escapeAttr(value);
  if (type === 'json' || type === 'factJson') return escapeJsonInner(value);
  if (type === 'js' || type === 'factJs') return escapeJsInner(value);
  throw new Error(`Unknown token context: ${type}`);
}
function absolutize(locale, page) {
  return facts.site.url + page.urlPath[locale];
}
function injectAlternates(html, locale, page) {
  const canonical = `<link rel="canonical" href="${absolutize(locale, page)}">`;
  const alternates = Object.keys(registry.locales).map((code) => `<link rel="alternate" hreflang="${code}" href="${absolutize(code, page)}">`).join('\n  ');
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${absolutize(registry.sourceLocale, page)}">`;
  return html
    .replace(/<meta property="og:url" content="[^"]+">/, `<meta property="og:url" content="${absolutize(locale, page)}">`)
    .replace(/<link rel="canonical" href="[^"]+">/, canonical)
    .replace(/(?:\n\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">)+/, `\n  ${alternates}\n  ${xDefault}`);
}
function injectJsonLdLocale(html, locale, page) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, body) => {
    const schema = JSON.parse(body);
    schema.inLanguage = locale;
    if (schema['@id']) {
      const hash = new URL(schema['@id']).hash;
      schema['@id'] = `${absolutize(locale, page)}${hash}`;
    }
    return `<script type="application/ld+json">\n  ${JSON.stringify(schema, null, 2).replace(/\n/g, '\n  ')}\n  </script>`;
  });
}
function injectLocale(html, locale) {
  const localeInfo = registry.locales[locale];
  return html
    .replace(/<html lang="[^"]+">/, `<html lang="${localeInfo.htmlLang}">`)
    .replace(/<meta property="og:locale" content="[^"]+">/, `<meta property="og:locale" content="${localeInfo.ogLocale}">`);
}
function localizeLinks(html, locale) {
  if (locale === registry.sourceLocale) return html;
  let output = html;
  const sourceLocale = registry.sourceLocale;
  const pagesBySourcePath = [...registry.pages].sort((a, b) => b.urlPath[sourceLocale].length - a.urlPath[sourceLocale].length);
  for (const registeredPage of pagesBySourcePath) {
    const sourcePath = registeredPage.urlPath[sourceLocale];
    const localePath = registeredPage.urlPath[locale];
    output = output.replaceAll(`href="${sourcePath}"`, `href="${localePath}"`);
    output = output.replaceAll(`href="${sourcePath}#`, `href="${localePath}#`);
  }
  return output;
}
function injectLanguageSwitch(html, locale, page) {
  const label = escapeAttr(requireLocale(locale, 'languageSwitch.aria'));
  const controls = Object.entries(registry.locales).map(([code, localeInfo]) => {
    const labelText = escapeHtml(localeInfo.label);
    return code === locale
      ? `<span class="active" aria-current="page">${labelText}</span>`
      : `<a href="${escapeAttr(page.urlPath[code])}">${labelText}</a>`;
  });
  const markup = `<span class="locale-switch" aria-label="${label}">${controls.join('<span aria-hidden="true">/</span>')}</span>`;
  if (html.includes('class="locale-switch"')) {
    return html.replace(/<span class="locale-switch"[^\n]*<\/span>/, markup);
  }
  return html.replace(/(<nav class="nav-links"[\s\S]*?<\/nav>)/, `$1\n        ${markup}`);
}
function injectFooterUrl(html, locale, page) {
  const marker = `${facts.site.host}${page.urlPath[locale]} · v2026.06.14`;
  return html.replace(new RegExp(`${facts.site.host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*· v2026\\.06\\.14`), marker);
}
function renderPage(page, locale) {
  let html = read(`src/templates/${page.template}`);
  html = html.replace(vehicleTokenPattern, () => renderVehicles(locale));
  html = html.replace(tokenPattern, (_, type, key) => resolveToken(type, key, locale));
  if (/{{[^}]+}}/.test(html)) throw new Error(`Residual token in ${page.template} for ${locale}`);
  html = injectLocale(html, locale);
  html = injectAlternates(html, locale, page);
  html = injectJsonLdLocale(html, locale, page);
  html = localizeLinks(html, locale);
  html = injectLanguageSwitch(html, locale, page);
  html = injectFooterUrl(html, locale, page);
  write(page.output[locale], html);
}
function renderSitemap() {
  const urls = registry.pages.flatMap((page) => Object.keys(registry.locales).map((locale) => {
    const loc = absolutize(locale, page);
    const links = Object.keys(registry.locales).map((code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${absolutize(code, page)}" />`).join('\n');
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolutize(registry.sourceLocale, page)}" />`;
    return `  <url>\n    <loc>${loc}</loc>\n${links}\n${xDefault}\n  </url>`;
  }));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
}
function renderLlms() {
  const template = read('src/templates/llms.txt');
  const body = template.replace(tokenPattern, (_, type, key) => resolveToken(type, key, registry.sourceLocale));
  if (/{{[^}]+}}/.test(body)) throw new Error('Residual token in llms.txt');
  write('llms.txt', body);
}

for (const page of registry.pages) {
  for (const locale of Object.keys(registry.locales)) renderPage(page, locale);
}
renderSitemap();
renderLlms();
