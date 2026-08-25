import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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
      if (key.startsWith('@')) continue;
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
    'vehicle.year',
    'vehicle.mileage',
    'vehicle.color',
    'vehicle.status.export',
    'vehicle.status.local',
    'vehicle.status.localExport'
  ]);
  for (const key of allKeys) {
    const usedByStructuredOptions = key.startsWith('countries.') || key.startsWith('form.countryGroups.') || key.startsWith('form.country.') || key.startsWith('vehicleColors.') || structuredOptionKeys.has(key);
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
}
function assertFactsNotInLocales() {
  const fixed = ['Okinawa Auto', 'OkinawaOnline', facts.contact.email, facts.contact.phoneDisplay, facts.site.url, facts.contact.whatsappUrl, facts.form.endpoint];
  for (const [locale, dict] of [['en', en], ['ru', ru]]) {
    for (const [key, value] of Object.entries(dict)) {
      for (const item of fixed) if (value.includes(item)) fail(`${locale} locale key ${key} embeds fixed fact ${item}`);
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
      if (locale === 'en' && !html.includes(`<span class="active" aria-current="page">EN</span><span aria-hidden="true">/</span><a href="${page.urlPath.ru}" lang="ru">RU</a>`)) fail(`Bad English language switch in ${file}`);
      if (locale === 'ru' && !html.includes(`<a href="${page.urlPath.en}" lang="en">EN</a><span aria-hidden="true">/</span><span class="active" aria-current="page">RU</span>`)) fail(`Bad Russian language switch in ${file}`);
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
    for (const field of ['id', 'brand', 'model', 'year', 'mileage', 'colorKey', 'statusKey']) {
      if (typeof vehicle[field] !== 'string' || vehicle[field].trim() === '') fail(`Vehicle ${key} missing ${field}`);
    }
    if (seen.has(vehicle.id)) fail(`Duplicate vehicle id ${vehicle.id}`);
    seen.add(vehicle.id);
    for (const locale of [en, ru]) {
      if (typeof locale[vehicle.colorKey] !== 'string' || !locale[vehicle.colorKey].trim()) fail(`Vehicle ${key} unknown colorKey ${vehicle.colorKey}`);
      if (typeof locale[vehicle.statusKey] !== 'string' || !locale[vehicle.statusKey].trim()) fail(`Vehicle ${key} unknown statusKey ${vehicle.statusKey}`);
    }
    if (!vehicle.media || typeof vehicle.media !== 'object') fail(`Vehicle ${key} missing media`);
    if (vehicle.media.type === 'emoji') {
      if (typeof vehicle.media.value !== 'string' || vehicle.media.value.trim() === '') fail(`Vehicle ${key} empty emoji media`);
    } else if (vehicle.media.type === 'image') {
      if (!fs.existsSync(path.join(root, vehicle.media.value || ''))) fail(`Vehicle ${key} image missing: ${vehicle.media.value}`);
    } else {
      fail(`Vehicle ${key} unsupported media type ${vehicle.media.type}`);
    }
    for (const factText of [vehicle.brand, vehicle.model, vehicle.year, vehicle.mileage, vehicle.media?.value]) {
      if (factText && template.includes(factText)) fail(`Vehicle fact leaked into template: ${factText}`);
      if (factText && builder.includes(factText)) fail(`Vehicle fact leaked into builder: ${factText}`);
    }
  }
  if (/images\/hero\.jpg/.test(JSON.stringify(facts))) fail('facts still reference nonexistent images/hero.jpg');
  const cardCount = (read('index.html').match(/class="vehicle-card" itemscope itemtype="https:\/\/schema.org\/Car"/g) || []).length;
  const ruCardCount = (read('ru/index.html').match(/class="vehicle-card" itemscope itemtype="https:\/\/schema.org\/Car"/g) || []).length;
  const expected = Object.keys(facts.vehicles).length;
  if (cardCount !== expected || ruCardCount !== expected) fail(`Generated vehicle count mismatch en=${cardCount} ru=${ruCardCount} expected=${expected}`);
}
function assertRussianLatinAllowlist() {
  const allowed = new Set(['Okinawa Auto','OKINAWA AUTO','OkinawaOnline','EN','RU','ru','en','FAQ','FOB','CIF','VAT','GST','WhatsApp','WeChat','Email','Toyota','Alphard','Hiace','Nissan','Serena','Honda','Stepwgn','Mazda','CX','XD','GL','e-POWER','Soul Red','URL','PDF','S','shaken','masshō tōroku','massh','tōroku','troku','roku','Japan','Okinawa','Auto','lt','gt','amp','quot','nbsp','km','nice.okinawa','info','v2026.06.14','your.com','email.com','your']);
  const values = [facts.contact.email, facts.contact.phoneDisplay, facts.site.host, facts.site.url, facts.contact.whatsappUrl, facts.form.endpoint, facts.form.site, facts.form.sourceSite, facts.form.turnstileSiteKey, facts.form.turnstileAction, ...Object.values(facts.vehicles).map((v) => v.model)];
  for (const v of values) allowed.add(v);
  for (const file of generated.filter((f) => f.startsWith('ru/'))) {
    const html = read(file);
    const jsonLdText = textBetween(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).flatMap((body) => collectJsonLdText(JSON.parse(body)));
    const scanParts = [
      stripTags(html),
      ...textBetween(html, /<(?:title|button|option)[^>]*>([\s\S]*?)<\/(?:title|button|option)>/g),
      ...textBetween(html, /(?:placeholder|aria-label)="([^"]+)"/g),
      ...textBetween(html, /<meta (?:name="description"|property="og:(?:title|description)") content="([^"]+)"/g),
      ...jsonLdText,
    ];
    const latin = new Set(scanParts.join(' ').match(/[A-Za-z][A-Za-z0-9+&./:'() -]{1,}/g) || []);
    for (const phrase of latin) {
      const clean = phrase.trim().replace(/\s+/g, ' ');
      if (!clean || /^https?:/.test(clean) || /^[\w.+-]+@[\w.-]+$/.test(clean) || /^\d/.test(clean)) continue;
      if (![...allowed].some((item) => clean === item || clean.includes(item))) fail(`Unallowlisted Latin text in ${file}: ${clean}`);
    }
    const approved = ['車検', '抹消登録'];
    const withoutApprovedJapaneseSection = html.replace(/<!-- JAPANESE SECTION -->[\s\S]*?<!-- FOOTER -->/, '<!-- FOOTER -->').replace(/日本語/g, '');
    const stripped = approved.reduce((body, item) => body.split(item).join(''), withoutApprovedJapaneseSection);
    if (/[ぁ-んァ-ン一-龯]/.test(stripped)) fail(`Unexpected Japanese/CJK in ${file}`);
  }
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
assertRussianLatinAllowlist();
console.log('i18n validation passed');
