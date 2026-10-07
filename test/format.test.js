import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read } from './load.js';

const JS = ['script.js', 'js/porta-core.js', 'js/messages.js',
  ...fs.readdirSync(new URL('./', import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => `test/${f}`)];

// ひらがな・カタカナ・CJK統合漢字・全角形（数値から組み立てる）
const JP = `${String.fromCodePoint(0x3040)}-${String.fromCodePoint(0x30ff)}${String.fromCodePoint(0x4e00)}-${String.fromCodePoint(0x9fff)}`
  + `${String.fromCodePoint(0xff00)}-${String.fromCodePoint(0xffef)}`;
const SPACED = new RegExp(`[${JP}] [A-Za-z0-9]|[A-Za-z0-9] [${JP}]`, 'u');

test('1行に詰め込まない（JS・CSS・テストは160文字、HTMLは250文字まで）', () => {
  for (const f of [...JS, 'style.css']) {
    read(f).split('\n').forEach((line, i) => assert.ok([...line].length <= 160, `${f}:${i + 1} ${[...line].length}`));
  }
  read('index.html').split('\n').forEach((line, i) => assert.ok([...line].length <= 250, `index.html:${i + 1}`));
});

test('主なファイルの行数の下限（縮めて書き直していない）', () => {
  const min = { 'script.js': 300, 'js/porta-core.js': 300, 'js/messages.js': 100, 'style.css': 400, 'index.html': 150 };
  for (const [f, n] of Object.entries(min)) assert.ok(read(f).split('\n').length >= n, f);
});

test('画面の文言で、日本語と英数字の間に空白を入れない', () => {
  // index.html はタグを除いた文字と属性の値、messages.js は文字列の値を見る
  const html = read('index.html').replace(/<script[\s\S]*?<\/script>/g, '');
  const texts = [...html.replace(/<[^>]+>/g, '\n').split('\n'), ...[...html.matchAll(/(?:aria-label|placeholder|alt|title)="([^"]*)"/g)].map((m) => m[1])];
  for (const s of texts) assert.ok(!SPACED.test(s), s.trim());
  for (const m of read('js/messages.js').matchAll(/^\s*'[^']+': '(.*)',$/gm)) assert.ok(!SPACED.test(m[1]), m[1]);
});

test('ファイルは LF で、制御文字を含まない', () => {
  for (const f of [...JS, 'style.css', 'index.html']) {
    const s = read(f);
    assert.ok(!s.includes('\r'), `${f} CR`);
    // タブと改行以外の制御文字
    assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s), `${f} control`);
  }
});
