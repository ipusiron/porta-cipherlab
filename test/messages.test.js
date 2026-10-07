import test from 'node:test';
import assert from 'node:assert/strict';
import { load, read } from './load.js';

load('js/porta-core.js');
const { PortaMessages: M } = load('js/messages.js');
const ja = M.dict.ja;

// コメントを除いたソース（文字列の中の // は残す）
function stripComments(src) {
  return src.split('\n').map((line) => (/^\s*\/\//.test(line) ? '' : line)).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

test('script.js が引くキーはすべて辞書にある', () => {
  const src = read('script.js');
  const keys = [...src.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 30);
  for (const k of keys) assert.ok(Object.hasOwn(ja, k), k);
  // テンプレートで組み立てるキー
  for (const reason of ['digit', 'symbol', 'notInTable']) assert.ok(Object.hasOwn(ja, `reason.${reason}`));
});

test('計算部が返すキーはすべて辞書にある', () => {
  const src = read('js/porta-core.js');
  const keys = [...src.matchAll(/msg\('([a-zA-Z0-9_.]+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 20);
  for (const k of keys) assert.ok(Object.hasOwn(ja, k), k);
});

test('文言の埋め込み: {name} を値で埋め、ないものは残す', () => {
  assert.equal(M.t('lookup.result', { first: 'H', second: 'E', code: '583' }), 'H（上の見出し）× E（左の見出し）→ 583');
  assert.equal(M.t('no.such.key'), 'no.such.key');
  assert.equal(M.tm({ key: 'error.noLetters' }), ja['error.noLetters']);
  assert.equal(M.tm(null), '');
});

test('script.js・計算部に日本語の文字列を書かない（文言は辞書に集める）', () => {
  // ひらがな・カタカナ・CJK統合漢字・全角形
  const ranges = [[0x3040, 0x30ff], [0x4e00, 0x9fff], [0xff00, 0xffef]];
  const re = new RegExp(`[${ranges.map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`).join('')}]`, 'u');
  for (const f of ['script.js', 'js/porta-core.js']) {
    const lines = stripComments(read(f)).split('\n');
    lines.forEach((line, i) => assert.ok(!re.test(line), `${f}:${i + 1} ${line.trim()}`));
  }
});
