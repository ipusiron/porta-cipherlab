import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { core, read } from './load.js';

const C = core();
const readme = read('README.md');
const yaml = readme.match(/^<!--\n---\n([\s\S]*?)\n---\n-->/)[1];

// 和文の句読点・ひらがな・カタカナ・CJK統合漢字・全角形（数値から組み立てる。U+3000 の全角空白は含めない）
const JP = `${String.fromCodePoint(0x3001)}-${String.fromCodePoint(0x30ff)}${String.fromCodePoint(0x4e00)}-${String.fromCodePoint(0x9fff)}`
  + `${String.fromCodePoint(0xff00)}-${String.fromCodePoint(0xffef)}`;
const SPACED = new RegExp(`[${JP}] [A-Za-z0-9\`]|[A-Za-z0-9\`] [${JP}]`, 'u');

// コードブロック・HTMLのコメントを除いた本文の行
function proseLines(md) {
  return md.replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '').split('\n');
}

test('先頭の YAML メタデータの構造と値', () => {
  const keys = [...yaml.matchAll(/^([a-z_]+):/gm)].map((m) => m[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  assert.match(yaml, /^id: day080$/m);
  assert.match(yaml, /^slug: porta-cipherlab$/m);
  assert.match(yaml, /^repo_url: "https:\/\/github\.com\/ipusiron\/porta-cipherlab"$/m);
  assert.match(yaml, /^demo_url: "https:\/\/ipusiron\.github\.io\/porta-cipherlab\/"$/m);
  assert.match(yaml, /^hub: true$/m);
  // リストはブロック形式（次の行が「  - 」）
  for (const k of ['category_ja', 'category_en', 'tags']) assert.match(yaml, new RegExp(`^${k}:\\n  - `, 'm'), k);
  assert.ok(!/\[.*\]/.test(yaml), 'フロー形式のリストを使わない');
});

test('シリーズ標準の構成（前半と後半の見出しの順）', () => {
  assert.match(readme, /\n# Porta CipherLab - ポルタの二文字式暗号ツール\n/);
  assert.match(readme, /\n\*\*Day080 - 生成AIで作るセキュリティツール100\*\*\n/);
  assert.match(readme, /https:\/\/akademeia\.info\/\?page_id=42163/);
  const h2 = [...readme.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(h2.slice(0, 2), ['🌐 デモページ', '📸 スクリーンショット']);
  assert.deepEqual(h2.slice(-4), ['📁 ディレクトリー構造', '💻 動作環境', '📄 ライセンス', '🛠️ このツールについて']);
  for (const h of h2) assert.match(h, /^\p{Extended_Pictographic}/u, h);
  assert.ok(h2.includes('🧪 テスト'));
  assert.ok(h2.includes('🎯 ユースケース'));
});

test('暗号文の例は計算部で計算し直すと一致する', () => {
  const rows = [...readme.matchAll(/^\| (26×26|20×20) \| (\w+) \| ([^|]+) \| ([^|]+) \| ([0-9 ]+) \|$/gm)];
  assert.equal(rows.length, 4);
  const delimiter = { '空白で区切る': 'space', '連結': 'concat' };
  const handling = { '置き換える': 'replace', '外す': 'drop' };
  for (const [, table, seed, plain, setting, expected] of rows) {
    const size = table === '20×20' ? 20 : 26;
    const key = C.makeKey(size, C.DEFAULT_RESERVED, C.seededUint32Source(seed)).key;
    const r = C.encrypt(key, plain.trim(), {
      dummy: C.DEFAULT_DUMMY[size],
      delimiter: delimiter[setting.trim()] || 'space',
      handling20: handling[setting.trim()] || 'replace',
    });
    assert.equal(r.output, expected.trim(), `${table} ${seed} ${plain}`);
  }
  // 本文の説明（置き換えたあとの英字と組の数）
  const k20 = C.makeKey(20, C.DEFAULT_RESERVED, C.seededUint32Source('PORTA1563')).key;
  const rep = C.encrypt(k20, 'Jupiter was here', { dummy: 'Z' });
  assert.equal(rep.letters, 'IVPITERVVASHERE');
  assert.equal(rep.pairs.length, 8);
  assert.match(readme, /IVPITERVVASHEREになり、15文字なので冗字Zを足して8組/);
  const drop = C.encrypt(k20, 'Jupiter was here', { dummy: 'Z', handling20: 'drop' });
  assert.equal(drop.letters, 'PITERASHERE');
  assert.equal(drop.pairs.length, 6);
});

test('ポルタの例文の記述（120字・60組・繰り返す組）', () => {
  const example = readme.match(/```text\n(MVLTIS[\s\S]*?)\n```/)[1].replace(/\n/g, ' ');
  const k20 = C.makeKey(20, C.DEFAULT_RESERVED, C.seededUint32Source('PORTA1563')).key;
  const r = C.encrypt(k20, example, { dummy: 'Z' });
  assert.equal(r.letters.length, 120);
  assert.equal(r.pairs.length, 60);
  assert.equal(r.dropped.filter((d) => d.reason === 'notInTable').length, 0);
  const counts = new Map();
  for (const p of r.pairs) counts.set(p, (counts.get(p) || 0) + 1);
  assert.equal(counts.get('IS'), 3);
  for (const p of ['QV', 'ED', 'AT', 'ER', 'ST', 'RE']) assert.equal(counts.get(p), 2, p);
  // 座学タブの例文と同じ
  assert.ok(read('index.html').includes(example.trim()));
  assert.ok(read('script.js').includes('RELIQVA NON SCRIBAM, SED IN CONGRESSVM NOSTRVM RESERVABO.'));
});

test('上限の記述は計算部の値と一致する', () => {
  const L = C.LIMITS;
  const fmt = (n) => n.toLocaleString('en-US');
  assert.ok(readme.includes(`平文・暗号文は${fmt(L.textChars)}文字、シードは${L.seedChars}文字、予約コードは${L.reservedCodes}個、鍵のファイルは${fmt(L.keyFileBytes)}バイト`));
  assert.equal(C.ALPHABET_20.split('').join(' '), 'A B C D E F G H I L M N O P Q R S T V Z');
  assert.ok(readme.includes('A B C D E F G H I L M N O P Q R S T V Z（J・K・U・W・X・Yはない）'));
});

test('README の画像はすべて実在し、assets の PNG は README から参照されているものだけ', () => {
  const refs = [...readme.matchAll(/!\[[^\]]*\]\((assets\/[^)]+\.png)\)/g)].map((m) => m[1]);
  assert.equal(refs.length, 6);
  assert.ok(readme.includes('](assets/porta1563_table.jpg)'));
  assert.ok(fs.existsSync(new URL('../assets/porta1563_table.jpg', import.meta.url)));
  for (const r of refs) assert.ok(fs.existsSync(new URL(`../${r}`, import.meta.url)), r);
  // 画面が使う素材（記号のスプライト）は README の画像の対象から外し、計算部から参照されていることを確かめる
  const toolAssets = [C.SYMBOL_SPRITE.file];
  for (const f of toolAssets) assert.ok(fs.existsSync(new URL(`../${f}`, import.meta.url)), f);
  const pngs = fs.readdirSync(new URL('../assets/', import.meta.url)).filter((f) => f.endsWith('.png')).map((f) => `assets/${f}`)
    .filter((f) => !toolAssets.includes(f));
  assert.deepEqual(pngs.sort(), refs.slice().sort());
});

test('ディレクトリー構造: すべてのファイルが載り、全行に説明がある', () => {
  const block = readme.match(/## 📁 ディレクトリー構造\n\n```text\n([\s\S]*?)```/)[1];
  const lines = block.trim().split('\n').slice(1);
  const paths = [];
  const stack = [];
  for (const line of lines) {
    const m = line.match(/^((?:│   |    )*)(?:├── |└── )(\S+)\s+# \S/);
    assert.ok(m, `説明のない行: ${line}`);
    const depth = m[1].length / 4;
    stack.length = depth;
    stack.push(m[2].replace(/\/$/, ''));
    if (!m[2].endsWith('/')) paths.push(stack.join('/'));
  }
  // # の桁をそろえる
  const cols = new Set(lines.map((l) => [...l.slice(0, l.indexOf('#'))].length));
  assert.equal(cols.size, 1, '説明の # の桁');
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).trim().split('\n');
  } catch (e) {
    tracked = null;
  }
  if (tracked) {
    for (const f of tracked) assert.ok(paths.includes(f), `ツリーにない: ${f}`);
  }
  for (const p of paths) assert.ok(fs.existsSync(new URL(`../${p}`, import.meta.url)), `実在しない: ${p}`);
});

test('表記: 長音・ひらく語・日本語と英数字の間の空白・強調の数', () => {
  const prose = proseLines(readme);
  const banned = [/ブラウザ(?!ー)/, /ユーザ(?!ー)/, /サーバ(?!ー)/, /ディレクトリ(?!ー)/, /リポジトリ(?!ー)/, /パラメータ(?!ー)/,
    /分かる|分かり|分かっ/, /全て/, /既に/, /インターフェース/];
  prose.forEach((line, i) => {
    for (const re of banned) assert.ok(!re.test(line), `${i + 1}: ${re} ${line}`);
    const text = line.replace(/`[^`]*`/g, 'CODE').replace(/https?:\/\/\S+/g, 'URL');
    assert.ok(!SPACED.test(text), `空白: ${line}`);
    assert.ok(!/[：:]$/.test(line.trim()) || /^\|/.test(line.trim()), `行末のコロン: ${line}`);
  });
  // 見出しと番号つきの箇条書きの形
  for (const line of prose) {
    if (/^#{1,4}[^#\s]/.test(line)) assert.fail(`見出しの空白: ${line}`);
    if (/^\d+\.\S/.test(line)) assert.fail(`番号の空白: ${line}`);
  }
  // 強調は H2 の節ごとに2か所まで
  for (const section of readme.split(/\n## /).slice(1)) {
    const n = (section.match(/\*\*[^*]+\*\*/g) || []).length;
    assert.ok(n <= 2, `${section.split('\n')[0]}: 強調 ${n}`);
  }
  // 箇条書きの先頭の項目名を太字にしない
  for (const line of prose) assert.ok(!/^\s*- \*\*/.test(line), line);
});

// ---- 英語版 README ----
const readmeEn = read('README.en.md');

test('日英の README は言語のリンクで結ばれ、見出しの数・順・階層が同じ', () => {
  assert.equal(readmeEn.split('\n')[0], 'English · [日本語](README.md)');
  assert.match(readme, /\n\[English\]\(README\.en\.md\) · 日本語\n/);
  const heads = (md) => proseLines(md).filter((l) => /^#{1,3} /.test(l)).map((l) => l.match(/^#+/)[0].length);
  assert.deepEqual(heads(readmeEn), heads(readme));
  const h2 = (md) => [...md.matchAll(/^## (\S+)/gm)].map((m) => m[1]);
  assert.deepEqual(h2(readmeEn), h2(readme));
  assert.match(readmeEn, /\n\*\*Day080 - 100 Security Tools with Generative AI\*\*\n/);
  assert.match(readmeEn, /https:\/\/akademeia\.info\/\?page_id=42163/);
  // YAML メタデータは README.md だけに置く
  assert.ok(!readmeEn.includes('<!--'));
});

test('英語版の暗号文の例も計算部で計算し直すと一致する', () => {
  const rows = [...readmeEn.matchAll(/^\| (26×26|20×20) \| (\w+) \| ([^|]+) \| ([^|]+) \| ([0-9 ]+) \|$/gm)];
  assert.equal(rows.length, 4);
  const delimiter = { Spaces: 'space', Joined: 'concat' };
  const handling = { Replace: 'replace', Remove: 'drop' };
  for (const [, table, seed, plain, setting, expected] of rows) {
    const size = table === '20×20' ? 20 : 26;
    const key = C.makeKey(size, C.DEFAULT_RESERVED, C.seededUint32Source(seed)).key;
    const r = C.encrypt(key, plain.trim(), {
      dummy: C.DEFAULT_DUMMY[size],
      delimiter: delimiter[setting.trim()] || 'space',
      handling20: handling[setting.trim()] || 'replace',
    });
    assert.equal(r.output, expected.trim(), `${table} ${seed} ${plain}`);
  }
  assert.ok(readmeEn.includes('becomes IVPITERVVASHERE, which has 15 letters'));
  assert.ok(readmeEn.includes('Plaintext and ciphertext 10,000 characters, seed 200 characters, reserved codes 300, key file 200,000 bytes'));
});

test('英語版の画像は assets/en/ の6枚で、すべて実在する', () => {
  const refs = [...readmeEn.matchAll(/!\[[^\]]*\]\((assets\/en\/[^)]+\.png)\)/g)].map((m) => m[1]);
  assert.equal(refs.length, 6);
  for (const r of refs) assert.ok(fs.existsSync(new URL(`../${r}`, import.meta.url)), r);
  const pngs = fs.readdirSync(new URL('../assets/en/', import.meta.url)).filter((f) => f.endsWith('.png')).map((f) => `assets/en/${f}`);
  assert.deepEqual(pngs.sort(), refs.slice().sort());
});

test('英語版のディレクトリー構造は日本語版と同じファイルを並べ、全行に説明がある', () => {
  const tree = (md) => md.match(/## 📁 [^\n]+\n\n```text\n([\s\S]*?)```/)[1].trim().split('\n').slice(1)
    .map((l) => l.replace(/\s+# .*$/, ''));
  assert.deepEqual(tree(readmeEn), tree(readme));
  const block = readmeEn.match(/## 📁 [^\n]+\n\n```text\n([\s\S]*?)```/)[1];
  for (const line of block.trim().split('\n').slice(1)) assert.match(line, /\s# \S/, line);
});

test('英語版に日本語の文字が混じらない（言語のリンクを除く）', () => {
  const re = new RegExp(`[${JP}]`, 'u');
  readmeEn.split('\n').slice(1).forEach((line, i) => assert.ok(!re.test(line), `${i + 2}: ${line}`));
});
