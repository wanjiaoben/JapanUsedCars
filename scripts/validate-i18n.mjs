import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import en from '../i18n/locales/en.mjs';
import ru from '../i18n/locales/ru.mjs';
import facts from '../i18n/facts.mjs';
import registry from '../i18n/registry.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tokenPattern = /{{(text|attr|json|js|fact|factAttr|factJson|factJs|options):([A-Za-z0-9_.-]+)}}/g;
const vehicleTokenPattern = /{{vehicles}}/g;
const localeTokenKinds = new Set(['text', 'attr', 'json', 'js']);
const factTokenKinds = new Set(['fact', 'factAttr', 'factJson', 'factJs']);
const generated = registry.pages.flatMap((page) => Object.values(page.output));
const templates = registry.pages.map((page) => `src/templates/${page.template}`).concat('src/templates/llms.txt');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fail(message) { throw new Error(message); }
function textBetween(html, regex) { return [...html.matchAll(regex)].map((m) => m[1]); }
function stripTags(html) { return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function collectJsonLdText(value, output = []) {
  if (typeof value === 'string') {
    if (!/^https?:/.test(value) && !/^P\d+[DWMY]$/.test(value) && !['FAQPage', 'Question', 'Answer', 'AutoDealer', 'LocalBusiness', 'PostalAddress', 'HowTo', 'HowToStep', 'HowToSupply'].includes(value)) output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdText(item, output));
    return output;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith('@') || ['inLanguage', 'url', 'telephone', 'email', 'image', 'addressCountry', 'areaServed', 'contactType'].includes(key)) continue;
      collectJsonLdText(item, output);
    }
  }
  return output;
}
function flattenFacts(obj, prefix = '') {
  const out = new Map();
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const item of flattenFacts(value, next)) out.set(item[0], item[1]);
    } else if (!Array.isArray(value)) out.set(next, String(value));
  }
  return out;
}
function assertKeyParity() {
  const enKeys = Object.keys(en).sort();
  const ruKeys = Object.keys(ru).sort();
  if (JSON.stringify(enKeys) !== JSON.stringify(ruKeys)) fail('English/Russian locale key sets differ');
  for (const key of enKeys) {
    if (typeof en[key] !== 'string' || en[key].trim() === '') fail(`Empty English translation: ${key}`);
    if (typeof ru[key] !== 'string' || ru[key].trim() === '') fail(`Empty Russian translation: ${key}`);
  }
}
function assertTokenUsage() {
  const localeUsed = new Set();
  const factUsed = new Set();
  for (const file of templates) {
    const html = read(file);
    for (const match of html.matchAll(tokenPattern)) {
      const [, kind, key] = match;
      if (localeTokenKinds.has(kind)) localeUsed.add(key);
      if (factTokenKinds.has(kind)) factUsed.add(key);
      if (kind === 'options' && !['countries', 'purposes'].includes(key)) fail(`Unknown options token ${key} in ${file}`);
    }
    const residue = html.replace(tokenPattern, '').replace(vehicleTokenPattern, '').match(/{{[^}]+}}/g);
    if (residue) fail(`Unsupported token in ${file}: ${residue[0]}`);
  }
  const allKeys = new Set(Object.keys(en));
  for (const key of localeUsed) if (!allKeys.has(key)) fail(`Template uses missing locale key: ${key}`);
  const structuredOptionKeys = new Set([
    'form.purpose.placeholder',
    'form.purpose.export',
    'form.purpose.local',
    'form.purpose.browse',
    'languageSwitch.aria',
    'vehicle.category.dieselSuv',
    'vehicle.category.familyMpv',
    'vehicle.category.hybridMpv',
    'vehicle.category.luxuryMpv',
    'vehicle.category.passengerCommercialVan',
    'vehicle.cta.sourceModel'
  ]);
  for (const key of allKeys) {
    const usedByStructuredOptions = key.startsWith('countries.') || key.startsWith('form.countryGroups.') || key.startsWith('form.country.') || structuredOptionKeys.has(key);
    if (!localeUsed.has(key) && !usedByStructuredOptions) fail(`Unused locale key: ${key}`);
  }
  const factsFlat = flattenFacts(facts);
  for (const key of factUsed) if (!factsFlat.has(key)) fail(`Template uses missing fact: ${key}`);
}
function assertNoResidualTokens() {
  for (const file of generated.concat(['sitemap.xml', 'llms.txt'])) {
    const html = read(file);
    if (/{{[^}]+}}/.test(html)) fail(`Residual token in generated file: ${file}`);
  }
}
function assertBuilderIsNotCopyDb() {
  const builder = read('scripts/build-i18n.mjs');
  if (/const\s+replacements\s*=/.test(builder)) fail('Builder still contains replacements table');
  if (/Подерж|Окинава|экспорт|автомобил/i.test(builder)) fail('Builder contains Russian page copy');
  if (/Okinawa Used Cars|Japan Used Car Export & Purchase Support/.test(builder)) fail('Builder contains English page copy');
  for (const forbidden of ["'/ru/", '"/ru/', "locale === 'ru'", 'page.urlPath.ru', 'page.urlPath.en', 'const locales = { en, ru }']) {
    if (builder.includes(forbidden)) fail(`Builder contains locale-specific logic: ${forbidden}`);
  }
}
function assertFactsNotInLocales() {
  const fixed = ['Okinawa Auto', 'OkinawaOnline', facts.contact.email, facts.contact.phoneDisplay, facts.site.url, facts.contact.whatsappUrl, facts.form.endpoint];
  for (const [locale, dict] of [['en', en], ['ru', ru]]) {
    for (const [key, value] of Object.entries(dict)) {
      if (key === 'pricing.payment.neverSend') continue;
      for (const fixedValue of fixed) if (value.includes(fixedValue)) fail(`${locale} locale key ${key} embeds fixed fact ${fixedValue}`);
    }
  }
}
function assertJsonLdAndFaq() {
  for (const file of generated) {
    const html = read(file);
    const scripts = textBetween(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const body of scripts) JSON.parse(body);
  }
  for (const file of ['index.html', 'ru/index.html']) {
    const html = read(file);
    const schema = JSON.parse(textBetween(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).find((s) => s.includes('FAQPage')));
    const visible = [...html.matchAll(/<article class="faq-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/article>/g)].map((m) => [stripTags(m[1]), stripTags(m[2])]);
    if (schema.mainEntity.length !== visible.length) fail(`FAQ count mismatch in ${file}`);
    schema.mainEntity.forEach((item, index) => {
      if (item.name !== visible[index][0]) fail(`FAQ question mismatch in ${file} #${index + 1}`);
      if (item.acceptedAnswer.text !== visible[index][1]) fail(`FAQ answer mismatch in ${file} #${index + 1}`);
    });
  }
}
function assertInlineJsSyntax() {
  for (const file of generated) {
    const html = read(file);
    for (const script of textBetween(html, /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
      if (script.trim().startsWith('{')) continue;
      new vm.Script(script, { filename: file });
    }
  }
}
function assertCanonicalHreflangAndSitemap() {
  const sitemap = read('sitemap.xml');
  for (const page of registry.pages) {
    for (const locale of Object.keys(registry.locales)) {
      const file = page.output[locale];
      const html = read(file);
      const self = facts.site.url + page.urlPath[locale];
      if (!html.includes(`<link rel="canonical" href="${self}">`)) fail(`Bad canonical in ${file}`);
      if (!html.includes(`<meta property="og:url" content="${self}">`)) fail(`Bad og:url in ${file}`);
      for (const [code, localeInfo] of Object.entries(registry.locales)) {
        const expected = code === locale
          ? `<span class="active" aria-current="page">${localeInfo.label}</span>`
          : `<a href="${page.urlPath[code]}">${localeInfo.label}</a>`;
        if (!html.includes(expected)) fail(`Bad ${locale} language switch in ${file}: missing ${code}`);
      }
      for (const body of textBetween(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        const schema = JSON.parse(body);
        if (schema.inLanguage !== locale) fail(`Bad JSON-LD inLanguage in ${file}`);
        if (schema['@id'] && !schema['@id'].startsWith(self)) fail(`Bad JSON-LD @id in ${file}`);
      }
      for (const alt of Object.keys(registry.locales)) {
        const href = facts.site.url + page.urlPath[alt];
        if (!html.includes(`hreflang="${alt}" href="${href}"`)) fail(`Missing hreflang ${alt} in ${file}`);
        if (!sitemap.includes(`<loc>${href}</loc>`) && alt === locale) fail(`Missing sitemap URL ${href}`);
      }
    }
  }
}
function assertFormContract() {
  for (const file of ['index.html', 'ru/index.html']) {
    const html = read(file);
    for (const fragment of [facts.form.endpoint, `site: '${facts.form.site}'`, `sourceSite: '${facts.form.sourceSite}'`, 'response.ok', 'result.ok', 'turnstileToken']) {
      if (!html.includes(fragment)) fail(`Form contract fragment missing in ${file}: ${fragment}`);
    }
    if (html.includes('gtag(') || html.includes('googletagmanager')) fail(`GA found in ${file}`);
    for (const purpose of facts.form.purposes) {
      if (!html.includes(`<option value="${purpose.value}">`)) fail(`Purpose stable value missing in ${file}: ${purpose.value}`);
    }
  }
  if (!read('index.html').includes(facts.analytics.beaconUrl) || !read('ru/index.html').includes(facts.analytics.beaconUrl)) fail('Beacon URL missing from generated pages');
  const templateText = templates.map((file) => read(file)).join('\n');
  const builder = read('scripts/build-i18n.mjs');
  const localeText = JSON.stringify({ en, ru });
  for (const fixed of [facts.form.endpoint, facts.analytics.beaconUrl]) {
    if (templateText.includes(fixed)) fail(`Template hardcodes shared runtime URL: ${fixed}`);
    if (builder.includes(fixed)) fail(`Builder hardcodes shared runtime URL: ${fixed}`);
    if (localeText.includes(fixed)) fail(`Locale hardcodes shared runtime URL: ${fixed}`);
  }
}
function assertVehiclesSingleSource() {
  const template = read('src/templates/home.html');
  const builder = read('scripts/build-i18n.mjs');
  if (!template.includes('{{vehicles}}')) fail('Home template missing {{vehicles}} token');
  const seen = new Set();
  for (const [key, vehicle] of Object.entries(facts.vehicles)) {
    for (const field of ['id', 'brand', 'model', 'categoryKey']) {
      if (typeof vehicle[field] !== 'string' || vehicle[field].trim() === '') fail(`Vehicle ${key} missing ${field}`);
    }
    for (const forbidden of ['year', 'mileage', 'colorKey', 'statusKey']) {
      if (Object.prototype.hasOwnProperty.call(vehicle, forbidden)) fail(`Example vehicle ${key} must not define ${forbidden}`);
    }
    if (seen.has(vehicle.id)) fail(`Duplicate vehicle id ${vehicle.id}`);
    seen.add(vehicle.id);
    for (const locale of [en, ru]) {
      if (typeof locale[vehicle.categoryKey] !== 'string' || !locale[vehicle.categoryKey].trim()) fail(`Vehicle ${key} unknown categoryKey ${vehicle.categoryKey}`);
      if (typeof locale['vehicle.cta.sourceModel'] !== 'string' || !locale['vehicle.cta.sourceModel'].trim()) fail(`Vehicle ${key} missing source CTA`);
    }
    if (!vehicle.media || typeof vehicle.media !== 'object') fail(`Vehicle ${key} missing media`);
    if (vehicle.media.type === 'emoji') {
      if (typeof vehicle.media.value !== 'string' || vehicle.media.value.trim() === '') fail(`Vehicle ${key} empty emoji media`);
    } else if (vehicle.media.type === 'image') {
      if (!fs.existsSync(path.join(root, vehicle.media.value || ''))) fail(`Vehicle ${key} image missing: ${vehicle.media.value}`);
    } else {
      fail(`Vehicle ${key} unsupported media type ${vehicle.media.type}`);
    }
    for (const factText of [vehicle.brand, vehicle.model, vehicle.media?.value]) {
      if (factText && template.includes(factText)) fail(`Vehicle fact leaked into template: ${factText}`);
      if (factText && builder.includes(factText)) fail(`Vehicle fact leaked into builder: ${factText}`);
    }
  }
  if (/images\/hero\.jpg/.test(JSON.stringify(facts))) fail('facts still reference nonexistent images/hero.jpg');
  const cardCount = (read('index.html').match(/<div class="vehicle-img">/g) || []).length;
  const ruCardCount = (read('ru/index.html').match(/<div class="vehicle-img">/g) || []).length;
  const expected = Object.keys(facts.vehicles).length;
  if (cardCount !== expected || ruCardCount !== expected) fail(`Generated vehicle count mismatch en=${cardCount} ru=${ruCardCount} expected=${expected}`);
}
function assertNoForbiddenClaims() {
  const forbidden = [
    'Current Stock',
    'Available for Export',
    'Local Stock',
    'Local & Export',
    '50+ Cars in Stock',
    '15+ Countries Exported',
    '100% Inspected',
    'Every vehicle on our lot has passed Japanese government inspection',
    'Full service history available for every car',
    'ready-to-register vehicle'
  ];
  for (const file of generated.concat(['llms.txt'])) {
    const body = read(file);
    for (const phrase of forbidden) {
      if (body.includes(phrase)) fail(`Forbidden claim remains in ${file}: ${phrase}`);
    }
    if (/<article class="vehicle-card"[^>]*itemscope|itemtype="https:\/\/schema\.org\/Car"|@type"\s*:\s*"Product"|@type"\s*:\s*"Offer"|itemprop="availability"/i.test(body)) {
      fail(`Inventory schema or availability marker remains in ${file}`);
    }
  }
}
function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function collectAllowedLatinItems() {
  const items = [];
  const add = (value, reason) => {
    if (typeof value === 'string' && value.trim() && /[A-Za-z]/.test(value)) items.push({ value, reason });
  };
  add('Okinawa Auto', 'brand name');
  add('OKINAWA AUTO', 'brand display name');
  add(facts.brand.network, 'brand network id');
  add('WhatsApp', 'contact channel');
  add('WeChat', 'contact channel');
  add(facts.contact.email, 'contact email');
  add(facts.site.host, 'site host');
  add(facts.site.url, 'site URL');
  add(facts.contact.whatsappUrl, 'WhatsApp URL');
  add(facts.contact.mapUrl, 'map URL');
  add(facts.analytics.beaconUrl, 'beacon URL');
  add('EN', 'language switch label');
  add('RU', 'language switch label');
  add('FAQ', 'standard page label');
  add('v2026.06.14', 'screenshot mark version');
  for (const code of ['FOB', 'CIF', 'VAT', 'GST', 'PDF', 'URL', 'km']) add(code, 'technical abbreviation');
  for (const romaji of ['shaken', 'masshō tōroku']) add(romaji, 'approved Japanese romaji');
  for (const page of registry.pages) {
    for (const locale of Object.keys(registry.locales)) add(facts.site.host + page.urlPath[locale], 'registry page URL');
  }
  for (const vehicle of Object.values(facts.vehicles)) {
    add(vehicle.brand, 'vehicle brand');
    add(vehicle.model, 'vehicle model');
  }
  return items;
}
function removeAllowedLatinSpans(text, allowedItems) {
  let remaining = decodeHtmlEntities(text).normalize('NFC');
  for (const item of allowedItems.sort((a, b) => b.value.length - a.value.length)) {
    const value = item.value.normalize('NFC');
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(value)}(?=$|[^A-Za-z0-9])`, 'g');
    remaining = remaining.replace(pattern, (_, prefix) => `${prefix} `);
  }
  return remaining;
}
function russianLatinDocuments(extraDocuments = []) {
  return generated.filter((file) => file.startsWith('ru/')).map((file) => ({ file, html: read(file) })).concat(extraDocuments);
}
function assertRussianLatinAllowlist(extraDocuments = []) {
  const allowed = collectAllowedLatinItems();
  for (const { file, html } of russianLatinDocuments(extraDocuments)) {
    const jsonLdText = textBetween(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).flatMap((body) => collectJsonLdText(JSON.parse(body)));
    const scanParts = [
      stripTags(html),
      ...textBetween(html, /<(?:title|button|option)[^>]*>([\s\S]*?)<\/(?:title|button|option)>/g),
      ...textBetween(html, /(?:placeholder|aria-label)="([^"]+)"/g),
      ...textBetween(html, /<meta (?:name="description"|property="og:(?:title|description)") content="([^"]+)"/g),
      ...jsonLdText,
    ];
    const remaining = removeAllowedLatinSpans(scanParts.join('\n'), allowed);
    const leaked = remaining.match(/[A-Za-z][A-Za-z0-9+&./:'() -]*/);
    if (leaked) fail(`Unallowlisted Latin text in ${file}: ${leaked[0].trim()}`);
    const approved = ['車検', '抹消登録'];
    const withoutApprovedJapaneseSection = html.replace(/<!-- JAPANESE SECTION -->[\s\S]*?<!-- FOOTER -->/, '<!-- FOOTER -->').replace(/日本語/g, '');
    const stripped = approved.reduce((body, item) => body.split(item).join(''), withoutApprovedJapaneseSection);
    if (/[ぁ-んァ-ン一-龯]/.test(stripped)) fail(`Unexpected Japanese/CJK in ${file}`);
  }
}
function assertRussianLatinRegressionTests() {
  const base = read('ru/pricing/index.html');
  const blocked = [
    'Full Documentation',
    'Ask on WhatsApp',
    'Send Inquiry',
    'Payment is Safe',
    'Never send payment',
    'This sentence must never pass the Russian translation validator.'
  ];
  for (const phrase of blocked) {
    let failed = false;
    try {
      assertRussianLatinAllowlist([{ file: `injected:${phrase}`, html: base.replace('</body>', `<p>${phrase}</p></body>`) }]);
    } catch (error) {
      failed = true;
      if (!String(error.message).includes('Unallowlisted Latin text')) throw error;
      console.log(`latin regression blocked: ${phrase}`);
    }
    if (!failed) fail(`Latin regression did not fail: ${phrase}`);
  }
  const allowedProbe = collectAllowedLatinItems().map((item) => `<span>${item.value}</span>`).join('\n');
  assertRussianLatinAllowlist([{ file: 'injected:allowed-latin-spans', html: `<html lang="ru"><head><title>Проверка</title></head><body>${allowedProbe}</body></html>` }]);
  console.log('latin allowlist positive probe passed');
}
function assertSyntheticThirdLocaleBuild() {
  const tempRoot = fs.mkdtempSync(path.join('/tmp', 'juc-i18n-third-locale-'));
  fs.cpSync(root, tempRoot, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules`)
  });
  const syntheticRegistry = JSON.parse(JSON.stringify(registry));
  syntheticRegistry.locales.zz = { code: 'zz', htmlLang: 'zz', ogLocale: 'zz_ZZ', basePath: '/zz/', label: 'ZZ' };
  for (const page of syntheticRegistry.pages) {
    const zzPath = page.urlPath.en === '/' ? '/zz/' : `/zz${page.urlPath.en}`;
    page.urlPath.zz = zzPath;
    page.output.zz = `${zzPath.slice(1)}index.html`;
  }
  fs.writeFileSync(path.join(tempRoot, 'i18n/registry.mjs'), `export default ${JSON.stringify(syntheticRegistry, null, 2)};\n`);
  fs.copyFileSync(path.join(tempRoot, 'i18n/locales/en.mjs'), path.join(tempRoot, 'i18n/locales/zz.mjs'));
  execFileSync(process.execPath, ['scripts/build-i18n.mjs'], { cwd: tempRoot, stdio: 'pipe' });
  const html = fs.readFileSync(path.join(tempRoot, 'zz/index.html'), 'utf8');
  const englishHtml = fs.readFileSync(path.join(tempRoot, 'index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(tempRoot, 'sitemap.xml'), 'utf8');
  if (!html.includes('<span class="active" aria-current="page">ZZ</span>')) fail('Synthetic third locale did not render active language switch');
  if (!html.includes('<a href="/"') || !html.includes('<a href="/ru/"')) fail('Synthetic third locale did not render existing locale links');
  if (!englishHtml.includes('href="/zz/"') || !sitemap.includes('https://japanusedcars.nice.okinawa/zz/')) fail('Synthetic third locale paths were not generated');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  console.log('synthetic third locale build passed');
}
function assertRobotsUnchanged() {
  const current = read('robots.txt');
  const head = fs.readFileSync(0, 'utf8');
  if (head && current !== head) fail('robots.txt changed');
}

assertKeyParity();
assertTokenUsage();
assertNoResidualTokens();
assertBuilderIsNotCopyDb();
assertFactsNotInLocales();
assertJsonLdAndFaq();
assertInlineJsSyntax();
assertCanonicalHreflangAndSitemap();
assertFormContract();
assertVehiclesSingleSource();
assertNoForbiddenClaims();
assertRussianLatinAllowlist();
assertRussianLatinRegressionTests();
assertSyntheticThirdLocaleBuild();
console.log('i18n validation passed');
