import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('japanusedcars inline JavaScript parses', () => {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => !/\bsrc=|application\/ld\+json/i.test(attributes))
    .map(([, , source]) => source);
  assert.ok(scripts.length > 0);
  for (const source of scripts) {
    assert.doesNotThrow(() => new Function(source));
  }
});

test('japanusedcars sends the exact site and sourceSite values to the inquiry endpoint', () => {
  assert.match(html, /site:\s*['"]japanusedcars['"]/);
  assert.match(html, /sourceSite:\s*['"]japanusedcars\.nice\.okinawa['"]/);
  assert.match(html, /fetch\(INQUIRY_ENDPOINT,\s*\{\s*method:\s*['"]POST['"]/s);
});

test('japanusedcars only reports receipt after an ok backend response', () => {
  const responseCheck = html.indexOf("if (!response.ok || !result.ok)");
  const successStatus = html.indexOf("setInquiryStatus('Thank you! We received your inquiry.");
  const errorStatus = html.indexOf("setInquiryStatus('Could not send.");
  assert.ok(responseCheck > -1);
  assert.ok(successStatus > responseCheck);
  assert.ok(errorStatus > successStatus);
  assert.doesNotMatch(html, /function handleSubmit\(\)\s*\{[^}]*alert\(/s);
});
