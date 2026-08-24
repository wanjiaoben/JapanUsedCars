import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const root = process.cwd();
const baseUrl = 'https://japanusedcars.nice.okinawa';
const pages = [
  ['home', 'index.html', 'src/templates/index.html', 'ru/index.html', '/', '/ru/'],
  ['how', 'how-it-works/index.html', 'src/templates/how-it-works.html', 'ru/how-it-works/index.html', '/how-it-works/', '/ru/how-it-works/'],
  ['pricing', 'pricing/index.html', 'src/templates/pricing.html', 'ru/pricing/index.html', '/pricing/', '/ru/pricing/'],
  ['faq', 'faq/index.html', 'src/templates/faq.html', 'ru/faq/index.html', '/faq/', '/ru/faq/']
];

const buildSource = read('scripts/build-i18n.mjs');
assert(!/\[\s*'[^']+'\s*,\s*'The'\s*,/.test(buildSource), 'unsafe standalone The translation rule found');
assert(!/\[\s*'[^']+'\s*,\s*'Okinawa'\s*,/.test(buildSource), 'unsafe standalone Okinawa translation rule found');
assert(!/\[\s*'[^']+'\s*,\s*'Auto'\s*,/.test(buildSource), 'unsafe standalone Auto translation rule found');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function origin(file) {
  return execFileSync('git', ['show', `origin/main:${file}`], { cwd: root, encoding: 'utf8' });
}

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function body(html) {
  return html.split(/<body[^>]*>/i)[1]?.split(/<\/body>/i)[0] || html;
}

function visibleText(html) {
  return body(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<span class="locale-switch"[\s\S]*?<\/span>\s*<\/span>/g, ' ')
    .replace(/\bEN\s*\/\s*RU\b|\/\s*RU\b|EN\s*\//g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bEN\s*\/\s*RU\b|\/\s*RU\b|EN\s*\//g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function hrefs(html) {
  return [...body(html).matchAll(/href="([^"]+)"/g)].map((m) => m[1]).sort();
}

function scripts(html) {
  return [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).sort();
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

function inlineScriptsAreValid(html, label) {
  const withoutJson = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  for (const match of withoutJson.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    new vm.Script(match[1], { filename: `${label}-inline.js` });
  }
}

function stripApprovedJapanese(html) {
  return html
    .replace(/<section class="jp-section" id="japanese"[\s\S]*?<\/section>/g, '')
    .replaceAll('車検', '')
    .replaceAll('抹消登録', '')
    .replaceAll('日本語', '');
}

function faqVisible(html) {
  return [...html.matchAll(/<div class="faq-item">[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/div>/g)]
    .map((m) => [clean(m[1]), clean(m[2])]);
}

function faqVisibleArticle(html) {
  return [...html.matchAll(/<article class="faq-item"><h2>([\s\S]*?)<\/h2><p>([\s\S]*?)<\/p><\/article>/g)]
    .map((m) => [clean(m[1]), clean(m[2])]);
}

function clean(text) {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

for (const [id, enFile, templateFile, ruFile, enPath, ruPath] of pages) {
  const base = origin(enFile);
  const template = read(templateFile);
  assert.equal(sha(template), sha(base), `${id} stage1 template/origin byte parity failed`);

  const en = read(enFile);
  assert.equal(visibleText(en), visibleText(base), `${id} stage2 English visible text parity failed`);
  assert.equal(count(en, /<section\b/g), count(base, /<section\b/g), `${id} section count changed`);
  for (const href of hrefs(base)) assert(hrefs(en).includes(href), `${id} original href missing: ${href}`);
  for (const src of scripts(base)) assert(scripts(en).includes(src), `${id} original script src missing: ${src}`);
  if (id === 'home') {
    for (const field of ['name', 'country', 'email', 'purpose', 'interest', 'message']) {
      assert(en.includes(`id="${field}"`), `${id} English form field missing ${field}`);
    }
  }
  assert(en.includes(`href="${baseUrl}${enPath}"`) || en.includes(`href="${baseUrl}${enPath.slice(0, -1)}"`), `${id} English canonical/alternate missing`);
  assert(en.includes(`hreflang="ru" href="${baseUrl}${ruPath}"`), `${id} ru alternate missing`);
  assert(!/google-analytics|googletagmanager|gtag\(/i.test(en), `${id} GA found in English`);
  jsonLd(en);
  inlineScriptsAreValid(en, `${id}-en`);

  const ru = read(ruFile);
  assert(ru.includes('<html lang="ru">'), `${id} ru lang missing`);
  assert(ru.includes(`<link rel="canonical" href="${baseUrl}${ruPath}">`), `${id} ru canonical missing`);
  assert(ru.includes(`hreflang="en" href="${baseUrl}${enPath}"`), `${id} ru en alternate missing`);
  assert(ru.includes(`hreflang="ru" href="${baseUrl}${ruPath}"`), `${id} ru self alternate missing`);
  assert(ru.includes(`hreflang="x-default" href="${baseUrl}${enPath}"`), `${id} ru x-default missing`);
  assert(ru.includes('property="og:locale" content="ru_RU"'), `${id} ru og locale missing`);
  assert(!/Владивосток|Vladivostok|доставка во Владивосток/i.test(ru), `${id} forbidden Vladivostok commitment`);
  assert(!/google-analytics|googletagmanager|gtag\(/i.test(ru), `${id} GA found in Russian`);
  assert(!/[一-龯]/.test(stripApprovedJapanese(ru)), `${id} unexpected CJK outside approved Japanese block/terms`);
  assert(!/Inquire Now|Browse Vehicles|Send Inquiry|Select country|Could not send|Buyer questions|Pricing basis/.test(visibleText(ru)), `${id} English visible placeholder found`);
  const blocks = jsonLd(ru);
  inlineScriptsAreValid(ru, `${id}-ru`);
  assert(blocks.length > 0, `${id} ru JSON-LD missing`);
  assert(ru.includes('class="locale-switch"'), `${id} ru locale switch missing`);
  if (id === 'home') {
    assert(ru.includes("language: document.documentElement.lang || 'ru'"), 'ru form language fallback missing');
    assert(!/\n\s*lang\s*:/.test(ru), 'unexpected lang payload field');
    assert(ru.includes("site: 'japanusedcars'"), 'site payload changed');
    assert(ru.includes("sourceSite: 'japanusedcars.nice.okinawa'"), 'sourceSite payload changed');
    assert(ru.includes('if (!response.ok || !result.ok)'), 'success condition changed');
    assert(ru.includes('https://analytics.nice.okinawa/beacon.js'), 'first-party beacon missing');
    assert(ru.includes('OkinawaOnline'), 'WeChat ID changed in Russian home');
  }
  const faqLd = blocks.find((block) => block['@type'] === 'FAQPage');
  if (faqLd) {
    const pairs = id === 'home' ? faqVisible(ru) : faqVisibleArticle(ru);
    if (pairs.length) {
      assert.equal(pairs.length, faqLd.mainEntity.length, `${id} ru FAQ visible/schema count mismatch`);
      faqLd.mainEntity.forEach((entity, index) => {
        assert.equal(pairs[index][0], entity.name, `${id} ru FAQ question mismatch ${index}`);
        assert.equal(pairs[index][1], entity.acceptedAnswer.text, `${id} ru FAQ answer mismatch ${index}`);
      });
    }
  }
}

const robots = read('robots.txt');
assert.equal(sha(robots), sha(origin('robots.txt')), 'robots.txt modified');
const allRu = pages.map(([, , , ruFile]) => read(ruFile)).join('\n');
assert(!allRu.includes('Окинава Auto'), 'Okinawa Auto was translated');
assert(!allRu.includes('ОкинаваOnline'), 'OkinawaOnline was translated');
assert(!allRu.includes('Преимущество agreed fee'), 'unsafe The replacement polluted pricing copy');
assert(!allRu.includes('Which countries and regions can you export to?'), 'FAQ English question leaked');
assert(!allRu.includes('Do you publish fixed vehicle prices?'), 'pricing English FAQ leaked');
assert(!allRu.includes('Full buyer or company name matching destination import records.'), 'how-it-works English document list leaked');
assert(!allRu.includes('Auction inspection sheet review is part of the purchase decision.'), 'pricing English paragraph leaked');
const sitemap = read('sitemap.xml');
for (const [, , , , enPath, ruPath] of pages) {
  assert(sitemap.includes(`${baseUrl}${enPath}`), `sitemap missing ${enPath}`);
  assert(sitemap.includes(`${baseUrl}${ruPath}`), `sitemap missing ${ruPath}`);
}
assert(!sitemap.includes('/cases/'), 'sitemap should not include cases');
const llms = read('llms.txt');
assert(llms.includes('Русские страницы используют те же общие бизнес-факты'), 'llms Russian summary missing');
assert(!/pending/i.test(llms), 'llms pending text found');

console.log('validate-i18n: PASS');
