import test from 'node:test';
import assert from 'node:assert/strict';
import { load, read } from './load.js';

const { PortaMessages: M } = load('js/messages.js');
const { PortaI18n: I } = load('js/i18n.js');
const { ja, en } = M.dict;
const html = read('index.html');

// 和文の句読点・ひらがな・カタカナ・CJK統合漢字・全角形（数値から組み立てる）
const JP_CHAR = new RegExp(`[${String.fromCodePoint(0x3001)}-${String.fromCodePoint(0x30ff)}`
  + `${String.fromCodePoint(0x4e00)}-${String.fromCodePoint(0x9fff)}${String.fromCodePoint(0xff00)}-${String.fromCodePoint(0xffef)}]`, 'u');

// 英語の画面に日本語が出てよいのは、日本語へ切り替えるボタンの表示だけ
const EN_JP_ALLOWED = new Set(['ui.langButton']);

test('日本語と英語の辞書は同じキーを持ち、{name} の置き場所も同じ', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ja).sort());
  for (const k of Object.keys(ja)) {
    const a = [...new Set(ja[k].match(/\{\w+\}/g) || [])].sort();
    const b = [...new Set(en[k].match(/\{\w+\}/g) || [])].sort();
    assert.deepEqual(b, a, k);
  }
});

test('英語の文言に日本語の文字が混じらない', () => {
  for (const [k, v] of Object.entries(en)) {
    if (EN_JP_ALLOWED.has(k)) continue;
    assert.ok(!JP_CHAR.test(v), `${k}: ${v}`);
  }
});

test('index.html の data-i18n・data-i18n-attr のキーはすべて辞書にあり、初期の文言は日本語の辞書と同じ', () => {
  const keys = new Set();
  for (const m of html.matchAll(/<(\w+)[^>]*?\sdata-i18n="([\w.]+)"[^>]*>([^<]*)<\/\1>/g)) {
    keys.add(m[2]);
    assert.ok(Object.hasOwn(ja, m[2]), m[2]);
    assert.equal(m[3].replace(/&amp;/g, '&'), ja[m[2]], m[2]);
  }
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      const [, key] = pair.split(':');
      keys.add(key);
      assert.ok(Object.hasOwn(ja, key), key);
    }
  }
  assert.ok(keys.size > 100);
  // data-i18n を付けたのに中身を取り出せなかった要素がない（入れ子の要素に付けていない）
  const all = [...html.matchAll(/\sdata-i18n="([\w.]+)"/g)].map((m) => m[1]);
  for (const k of all) assert.ok(keys.has(k), k);
});

test('初期の言語: ?lang= → 保存した選択 → ブラウザーの言語（日本語以外は英語）', () => {
  assert.equal(I.initialLanguage('?lang=en', 'ja', ['ja-JP']), 'en');
  assert.equal(I.initialLanguage('?x=1&lang=ja', 'en', ['en-US']), 'ja');
  assert.equal(I.initialLanguage('', 'en', ['ja-JP']), 'en');
  assert.equal(I.initialLanguage('', null, ['ja-JP', 'en']), 'ja');
  assert.equal(I.initialLanguage('', null, ['fr-FR']), 'en');
  assert.equal(I.initialLanguage('', 'xx', []), 'en');
  assert.equal(I.initialLanguage('?lang=de', null, ['ja']), 'ja');
});

test('言語の切り替えは辞書にある言語だけ', () => {
  assert.equal(M.setLanguage('en'), 'en');
  assert.equal(M.t('ui.tabDocs'), 'Background');
  assert.equal(M.setLanguage('de'), 'en');
  assert.equal(M.setLanguage('ja'), 'ja');
  assert.equal(M.t('ui.tabDocs'), '座学');
});
