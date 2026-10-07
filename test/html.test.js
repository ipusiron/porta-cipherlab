import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read } from './load.js';

const html = read('index.html');
const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';

test('CSP: 外部を読まず、インラインのスクリプトとスタイルを許さない', () => {
  assert.ok(csp, 'CSP の meta がある');
  for (const part of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
    "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(csp.includes(part), part);
  }
  assert.ok(!csp.includes('unsafe-inline'));
  assert.ok(!csp.includes('unsafe-eval'));
  // meta の CSP では frame-ancestors は効かない
  assert.ok(!csp.includes('frame-ancestors'));
  assert.ok(!/https?:/.test(csp), '外部のホストを許していない');
});

test('referrer・favicon・noscript', () => {
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<link rel="icon" href="data:,">/);
  assert.match(html, /<noscript>/);
  assert.match(html, /<html lang="ja">/);
});

test('インラインのイベントハンドラー・style 属性・インラインのスクリプトがない', () => {
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'on〜= の属性がない');
  assert.ok(!/\sstyle\s*=/i.test(html), 'style 属性がない');
  assert.ok(!/<style[\s>]/i.test(html), 'style 要素がない');
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.deepEqual(scripts.map((m) => (m[1].match(/src="([^"]+)"/) || [])[1]), ['js/porta-core.js', 'js/messages.js', 'script.js']);
  for (const m of scripts) {
    assert.equal(m[2].trim(), '', 'script の中身は空');
    assert.match(m[1], /\sdefer/);
  }
});

test('画像はリポジトリーの中のファイルを読む', () => {
  const srcs = [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0);
  for (const src of srcs) {
    assert.ok(!/^https?:/.test(src), src);
    assert.ok(fs.existsSync(new URL(`../${src}`, import.meta.url)), src);
  }
  for (const m of html.matchAll(/<img[^>]*>/g)) assert.match(m[0], /\salt="[^"]+"/);
});

test('画面の処理が使う要素の id がそろっている', () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const script = read('script.js');
  const used = new Set([...script.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map((m) => m[1]));
  assert.ok(used.size > 30);
  for (const id of used) assert.ok(ids.has(id), `#${id}`);
  // id の重複がない
  const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(all.length, ids.size);
});

test('タブは WAI-ARIA の tablist・tab・tabpanel で結ばれている', () => {
  const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
  assert.equal(tabs.length, 6);
  for (const tab of tabs) {
    const id = tab.match(/\sid="([^"]+)"/)[1];
    const panel = tab.match(/aria-controls="([^"]+)"/)[1];
    const re = new RegExp(`<section id="${panel}"[^>]*role="tabpanel"[^>]*aria-labelledby="${id}"`);
    assert.match(html, re, panel);
  }
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
});

test('? ボタンは button で、開閉する説明の要素を指す', () => {
  const buttons = [...html.matchAll(/<button[^>]*class="help-button"[^>]*>/g)].map((m) => m[0]);
  assert.ok(buttons.length >= 5);
  for (const b of buttons) {
    assert.match(b, /type="button"/);
    assert.match(b, /aria-expanded="false"/);
    const target = b.match(/aria-controls="([^"]+)"/)[1];
    assert.match(html, new RegExp(`<p id="${target}" class="help-text" hidden>`));
  }
});

test('すべての button に type があり、入力欄にラベルがある', () => {
  for (const m of html.matchAll(/<button[^>]*>/g)) assert.match(m[0], /type="button"/, m[0]);
  for (const m of html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"[^>]*>/g)) {
    if (/type="file"/.test(m[0])) continue;
    assert.match(html, new RegExp(`<label[^>]*for="${m[1]}"`), m[1]);
  }
});

test('画面の処理は innerHTML・eval・document.write を使わない', () => {
  for (const f of ['script.js', 'js/porta-core.js', 'js/messages.js']) {
    const src = read(f);
    assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(src), f);
    assert.ok(!/\beval\(|new Function\(|document\.write/.test(src), f);
  }
});
