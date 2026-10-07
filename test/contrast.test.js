import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const css = read('style.css');
const root = css.match(/:root\s*\{([^}]+)\}/)[1];
const vars = Object.fromEntries([...root.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const color = (v) => (v.startsWith('#') ? v : vars[v]);

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [luminance(color(a)), luminance(color(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test('配色の変数が読める', () => {
  for (const k of ['primary-color', 'primary-hover', 'heading-color', 'text-dark', 'text-light', 'page-bg', 'focus-color']) {
    assert.ok(vars[k], k);
  }
});

test('文字と背景の組は 4.5:1 以上', () => {
  const pairs = [
    ['text-dark', '#ffffff'], ['text-dark', 'page-bg'], ['text-dark', 'bg-light'], ['text-dark', 'help-bg'],
    ['text-dark', 'hl-line'], ['text-dark', 'hl-cell'], ['text-dark', '#e9eef0'],
    ['text-light', '#ffffff'], ['text-light', 'page-bg'], ['text-light', 'bg-light'],
    ['heading-color', '#ffffff'], ['heading-color', 'page-bg'], ['heading-color', 'bg-light'], ['heading-color', '#e9eef0'],
    ['heading-color', 'hl-line'],
    ['#ffffff', 'primary-color'], ['#ffffff', 'primary-hover'], ['#ffffff', 'heading-color'], ['#ffffff', 'clear-color'],
    ['#ffffff', '#8c3a3a'], ['#ffffff', 'success-color'], ['#ffffff', 'text-dark'],
    ['success-color', 'success-bg'], ['error-color', 'error-bg'], ['warning-color', 'warning-bg'],
    ['#0d47a1', '#e3f2fd'], ['#1565c0', '#e3f2fd'], ['#b71c1c', 'error-bg'], ['#c62828', 'error-bg'],
  ];
  for (const [fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)}`);
});

test('フォーカスの枠は背景に対して 3:1 以上', () => {
  for (const bg of ['#ffffff', 'page-bg', 'bg-light', 'primary-color']) {
    const r = ratio('focus-color', bg);
    // 主ボタンの上の枠は外側（白・ページの地）に出るので、主ボタンの色とは比べない
    if (bg === 'primary-color') continue;
    assert.ok(r >= 3, `focus on ${bg}: ${r.toFixed(2)}`);
  }
  assert.match(css, /:focus-visible\s*\{\s*outline: 3px solid var\(--focus-color\);\s*outline-offset: 2px;/);
  assert.ok(!/outline:\s*none/.test(css), 'outline: none で枠を消していない');
});

test('入力欄は16px以上、ボタンは高さ44px以上', () => {
  assert.match(css, /textarea \{\s*padding: 8px 12px;[^}]*font-size: 16px;[^}]*min-height: 44px;/);
  assert.match(css, /\nbutton \{\s*min-height: 44px;/);
  assert.match(css, /\.tab-button \{[^}]*min-height: 44px;/);
  assert.match(css, /\.help-button \{\s*width: 44px;\s*height: 44px;/);
});

test('非表示の説明・トーストはレイアウトに残らない（display: none）', () => {
  assert.match(css, /\[hidden\] \{\s*display: none !important;/);
  assert.match(css, /\.toast \{[^}]*display: none;/);
  assert.ok(!/visibility:\s*hidden/.test(css));
});
