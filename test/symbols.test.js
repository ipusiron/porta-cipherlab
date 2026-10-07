import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { core } from './load.js';

const C = core();
const asset = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url));

// 原典の画像は作業側のスクリプト（1563年初版 p.90・p.91 のスキャンから切り出す）で作る。ここで内容を固定する
const SHA256 = {
  'assets/porta1563_symbols.png': '198e8b9e9553d95e5a0753ce66c91090568505426890393409bc00a9668a9b03',
  'assets/porta1563_example.jpg': 'a8bbef1ae1db07dfd22be4f36e41d511ced2db1ff595eef59179ad5f06a1f4b7',
  'assets/porta1563_table.jpg': '7ab56bd5d4ef0e717cb41364285c158cbd656ee808f537bf6731ad93ab626b9b',
};

// ポルタ自身の例文の組（p.91 に刷られた暗号文と、切り出した記号を1つずつ見比べて一致を確かめた順）
const EXAMPLE_PAIRS = [
  'MV', 'LT', 'IS', 'CL', 'AD', 'IB', 'VS', 'VL', 'TR', 'OC', 'IT', 'RO', 'QV', 'ED', 'AT',
  'IS', 'ET', 'AC', 'CE', 'PT', 'IS', 'VN', 'IV', 'ER', 'SA', 'PE', 'NE',
  'CI', 'VI', 'TA', 'SO', 'CC', 'VP', 'AT', 'AE', 'ST', 'RE', 'LI', 'QV', 'AN', 'ON', 'SC',
  'RI', 'BA', 'MS', 'ED', 'IN', 'CO', 'NG', 'RE', 'SS', 'VM', 'NO', 'ST', 'RV',
  'MR', 'ES', 'ER', 'VA', 'BO',
];

test('原典の画像は切り出したときのまま', () => {
  for (const [f, hash] of Object.entries(SHA256)) {
    assert.equal(crypto.createHash('sha256').update(asset(f)).digest('hex'), hash, f);
  }
});

test('記号のスプライトは 20×20 マス（1マス 52×64px）の PNG', () => {
  const png = asset(C.SYMBOL_SPRITE.file);
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
  // IHDR の幅と高さ
  assert.equal(png.readUInt32BE(16), C.SYMBOL_SPRITE.cols * C.SYMBOL_SPRITE.tileW);
  assert.equal(png.readUInt32BE(20), C.SYMBOL_SPRITE.rows * C.SYMBOL_SPRITE.tileH);
  assert.equal(png.readUInt32BE(16), 1040);
  assert.equal(png.readUInt32BE(20), 1280);
});

test('組とマスの位置: 列＝1文字目、行＝2文字目（原典の引き方）', () => {
  assert.deepEqual(C.symbolCell('MV'), { pair: 'MV', col: 10, row: 18 });
  assert.deepEqual(C.symbolCell('AA'), { pair: 'AA', col: 0, row: 0 });
  assert.deepEqual(C.symbolCell('ZZ'), { pair: 'ZZ', col: 19, row: 19 });
  assert.equal(C.symbolCell('JA'), null);
  assert.equal(C.symbolCell('AY'), null);
  assert.equal(C.symbolCell('A'), null);
  assert.equal(C.pairFromCell(10, 18), 'MV');
  assert.equal(C.pairFromCell(20, 0), null);
  assert.equal(C.pairFromCell(-1, 0), null);
  assert.equal(C.pairFromCell(1.5, 0), null);
  for (let c = 0; c < 20; c++) {
    for (let r = 0; r < 20; r++) assert.deepEqual(C.symbolCell(C.pairFromCell(c, r)), { pair: C.pairFromCell(c, r), col: c, row: r });
  }
});

test('ポルタの例文を原典の記号にすると、p.91 に刷られた暗号文と同じ順の60個になる', () => {
  const r = C.encryptSymbols(C.PORTA_EXAMPLE);
  assert.equal(r.ok, true);
  assert.deepEqual(r.pairs, EXAMPLE_PAIRS);
  assert.equal(r.padded, false);
  assert.equal(r.cells.length, 60);
  // 刷られた暗号文の行の数
  assert.deepEqual(C.PORTA_EXAMPLE_LINES, [15, 12, 15, 13, 5]);
  assert.equal(C.PORTA_EXAMPLE_LINES.reduce((a, b) => a + b, 0), 60);
  const lines = C.splitLines(r.cells, C.PORTA_EXAMPLE_LINES);
  assert.deepEqual(lines.map((l) => l.length), [15, 12, 15, 13, 5]);
  assert.equal(lines[4][4].pair, 'BO');
});

test('原典の記号: 20文字の表への置き換え・冗字・往復', () => {
  const r = C.encryptSymbols('Jupiter was here');
  assert.equal(r.letters, 'IVPITERVVASHERE');
  assert.equal(r.padded, true);
  assert.equal(r.pairs.at(-1), 'EZ');
  const back = C.decodeSymbols(r.cells, { stripDummy: true });
  assert.equal(back.letters, 'IVPITERVVASHERE');
  assert.equal(back.strippedDummy, true);
  assert.equal(C.decodeSymbols(r.cells, { stripDummy: false }).letters, 'IVPITERVVASHEREZ');
  assert.equal(C.encryptSymbols('Jupiter', { handling20: 'drop' }).letters, 'PITER');
  assert.equal(C.encryptSymbols('123').error.key, 'error.noLetters');
  assert.equal(C.encryptSymbols('AB', { dummy: 'X' }).error.key, 'error.dummyNotInTable');
  assert.equal(C.decodeSymbols([{ col: 25, row: 0 }]).error.key, 'error.badSymbol');
  assert.deepEqual(C.decodeSymbols([]), { ok: true, pairs: [], letters: '', strippedDummy: false });
});

test('行に分ける: 余りは最後の行に続ける', () => {
  assert.deepEqual(C.splitLines([1, 2, 3, 4, 5], [2, 2]), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(C.splitLines([1, 2], [3, 3]), [[1, 2]]);
  assert.deepEqual(C.splitLines([], [3]), []);
});
