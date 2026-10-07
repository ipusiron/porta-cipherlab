import test from 'node:test';
import assert from 'node:assert/strict';
import { core } from './load.js';

const C = core();

// 既知解答は、JS の計算部とは独立に書いた Python の参照実装（cyrb128＋sfc32＋Fisher–Yates）で出した値
const KNOWN = {
  sfc32First5: [2706000744, 2049348732, 1172208682, 3950047067, 1066814552],
  cyrb128Demo: [2296141636, 58823626, 182174638, 351035481],
  cyrb128Empty: [41608494, 3485963809, 1435736333, 1262568316],
  k26Row0: ['485', '158', '307', '781', '182', '159', '856', '381', '577', '099', '902', '141', '109',
    '219', '471', '816', '064', '737', '358', '637', '248', '187', '809', '843', '293', '540'],
  enc26Hello: '583 950 564 161 096',
  enc26Meet: '727674637638402',
  k20Row0: ['296', '761', '185', '389', '143', '359', '081', '259', '773', '315', '727', '202', '756',
    '231', '923', '021', '916', '339', '394', '906'],
  porta: 'MVLTIS CLADIBVS VLTRO CITROQVE DATIS ET ACCEPTIS, VNIVERSA PENE CIVITAS OCCVPATA EST, '
    + 'RELIQVA NON SCRIBAM, SED IN CONGRESSVM NOSTRVM RESERVABO.',
  enc20Porta: '402 545 630 329 389 420 900 399 038 716 941 789 372 376 339 630 467 185 318 116 630 977 788 726 '
    + '260 718 990 290 355 965 926 078 473 339 143 835 981 382 372 202 953 660 731 435 609 376 441 670 694 981 '
    + '879 702 912 835 141 524 740 726 757 894',
  enc20Jupiter: '788 505 701 141 757 717 726 501',
  enc20JupiterDrop: '505 701 538 717 726 501',
};

const demo26 = () => C.makeKey(26, ['000', '999'], C.seededUint32Source('DEMO2024')).key;
const porta20 = () => C.makeKey(20, ['000', '999'], C.seededUint32Source('PORTA1563')).key;

test('20文字の表は原典どおり A〜Z から J・K・U・W・X・Y を除いた並び（Z を含む）', () => {
  assert.equal(C.ALPHABET_20, 'ABCDEFGHILMNOPQRSTVZ');
  assert.equal(C.ALPHABET_20.length, 20);
  for (const ch of 'JKUWXY') assert.ok(!C.ALPHABET_20.includes(ch), ch);
  assert.ok(C.ALPHABET_20.includes('Z'));
  assert.equal(C.ALPHABET_26.length, 26);
  assert.deepEqual(C.REPLACE_20, { J: 'I', U: 'V', W: 'VV' });
  // 冗字の既定はどちらの表にもある文字
  assert.ok(C.ALPHABET_20.includes(C.DEFAULT_DUMMY[20]));
  assert.ok(C.ALPHABET_26.includes(C.DEFAULT_DUMMY[26]));
});

test('正規化: 英字以外は位置と種類つきで外す。全角英字と小文字は大文字の英字にする', () => {
  const r = C.normalizeText('Hello, World 2026!', 26);
  assert.equal(r.letters, 'HELLOWORLD');
  assert.deepEqual(r.dropped.map((d) => [d.pos, d.char, d.reason]), [
    [6, ',', 'symbol'], [7, ' ', 'space'], [13, ' ', 'space'],
    [14, '2', 'digit'], [15, '0', 'digit'], [16, '2', 'digit'], [17, '6', 'digit'], [18, '!', 'symbol'],
  ]);
  assert.equal(C.normalizeText(String.fromCodePoint(0xff21, 0xff42, 0xff23), 26).letters, 'ABC');
  // アクセントつきの文字は英字にしない（外して一覧に出す）
  const e = C.normalizeText('caf' + String.fromCodePoint(0xe9), 26);
  assert.equal(e.letters, 'CAF');
  assert.equal(e.dropped[0].reason, 'symbol');
  // サロゲートペアの絵文字は1文字として数える
  const emoji = C.normalizeText(String.fromCodePoint(0x1f600) + 'AB', 26);
  assert.equal(emoji.letters, 'AB');
  assert.deepEqual(emoji.dropped.map((d) => d.pos), [1]);
  assert.equal(emoji.inputLength, 3);
});

test('20文字の表: J→I・U→V・W→VV に置き換え、K・X・Y は外す。Z は残す', () => {
  const r = C.normalizeText('JUW KXY Z', 20, { handling20: 'replace' });
  assert.equal(r.letters, 'IVVVZ');
  assert.deepEqual(r.replaced.map((x) => [x.pos, x.char, x.to]), [[1, 'J', 'I'], [2, 'U', 'V'], [3, 'W', 'VV']]);
  assert.deepEqual(r.dropped.filter((d) => d.reason === 'notInTable').map((d) => d.char), ['K', 'X', 'Y']);
  const d = C.normalizeText('JUW KXY Z', 20, { handling20: 'drop' });
  assert.equal(d.letters, 'Z');
  assert.equal(d.replaced.length, 0);
  assert.deepEqual(d.dropped.filter((x) => x.reason === 'notInTable').map((x) => x.char), ['J', 'U', 'W', 'K', 'X', 'Y']);
  // 26文字の表では置き換えない
  assert.equal(C.normalizeText('JUW KXY Z', 26).letters, 'JUWKXYZ');
});

test('入力の上限を超えたらエラー', () => {
  const r = C.normalizeText('A'.repeat(C.LIMITS.textChars + 1), 26);
  assert.equal(r.ok, false);
  assert.equal(r.error.key, 'error.tooLong');
  assert.equal(C.normalizeText('A'.repeat(C.LIMITS.textChars), 26).ok, true);
});

test('2文字ずつに区切り、奇数個なら冗字を1つ足す', () => {
  assert.deepEqual(C.toPairs('ABC', 'X'), { pairs: ['AB', 'CX'], padded: true });
  assert.deepEqual(C.toPairs('ABCD', 'X'), { pairs: ['AB', 'CD'], padded: false });
});

test('冗字は表にある1文字だけ', () => {
  assert.deepEqual(C.checkDummy('x', 26), { ok: true, dummy: 'X' });
  assert.equal(C.checkDummy('X', 20).error.key, 'error.dummyNotInTable');
  assert.equal(C.checkDummy('', 26).ok, false);
  assert.equal(C.checkDummy('AB', 26).ok, false);
  assert.deepEqual(C.checkDummy('z', 20), { ok: true, dummy: 'Z' });
});

test('擬似乱数（cyrb128＋sfc32）は Python の参照実装と一致する', () => {
  assert.deepEqual(C.cyrb128('DEMO2024'), KNOWN.cyrb128Demo);
  assert.deepEqual(C.cyrb128(''), KNOWN.cyrb128Empty);
  const next = C.seededUint32Source('DEMO2024');
  assert.deepEqual([next(), next(), next(), next(), next()], KNOWN.sfc32First5);
  // シードは NFC にそろえてから使う（合成済みと分解した「ポ」が同じ表になる）
  const composed = C.seededUint32Source(String.fromCodePoint(0x30dd));
  const decomposed = C.seededUint32Source(String.fromCodePoint(0x30db, 0x309a));
  assert.equal(composed(), decomposed());
});

test('既知解答: シード DEMO2024 の26×26と、シード PORTA1563 の20×20', () => {
  const k26 = demo26();
  assert.deepEqual(k26.matrix[0], KNOWN.k26Row0);
  assert.equal(C.encrypt(k26, 'Hello world.', { dummy: 'X' }).output, KNOWN.enc26Hello);
  assert.equal(C.encrypt(k26, 'MEET AT NOON', { dummy: 'X', delimiter: 'concat' }).output, KNOWN.enc26Meet);
  const k20 = porta20();
  assert.deepEqual(k20.matrix[0], KNOWN.k20Row0);
  const p = C.encrypt(k20, KNOWN.porta, { dummy: 'Z' });
  assert.equal(p.output, KNOWN.enc20Porta);
  assert.equal(p.letters.length, 120);
  assert.equal(p.padded, false);
  assert.equal(C.encrypt(k20, 'Jupiter was here', { dummy: 'Z' }).output, KNOWN.enc20Jupiter);
  assert.equal(C.encrypt(k20, 'Jupiter was here', { dummy: 'Z', handling20: 'drop' }).output, KNOWN.enc20JupiterDrop);
});

test('ポルタの例文の中でも同じ組（同じ記号）が繰り返す', () => {
  const p = C.encrypt(porta20(), KNOWN.porta, { dummy: 'Z' });
  const counts = new Map();
  for (const pair of p.pairs) counts.set(pair, (counts.get(pair) || 0) + 1);
  assert.equal(counts.get('IS'), 3);
  assert.deepEqual([...counts].filter(([, n]) => n === 2).map(([k]) => k).sort(), ['AT', 'ED', 'ER', 'QV', 'RE', 'ST']);
});

test('往復: 暗号化して復号すると英字の列に戻る（両方の表・両方の区切り）', () => {
  let s = 12345;
  const rand = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  for (const key of [demo26(), porta20()]) {
    const dummy = C.DEFAULT_DUMMY[key.size];
    for (let n = 0; n < 200; n++) {
      const len = 1 + Math.floor(rand() * 40);
      let text = '';
      for (let i = 0; i < len; i++) text += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ,.0'[Math.floor(rand() * 30)];
      for (const delimiter of ['space', 'concat']) {
        const enc = C.encrypt(key, text, { dummy, delimiter });
        if (!enc.ok) {
          assert.equal(enc.error.key, 'error.noLetters');
          continue;
        }
        const dec = C.decrypt(key, enc.output, { dummy, delimiter, stripDummy: true });
        assert.equal(dec.ok, true);
        const endsWithDummy = enc.warnings.some((w) => w.key === 'warn.endsWithDummy');
        if (endsWithDummy) assert.equal(dec.output, enc.letters.slice(0, -1));
        else assert.equal(dec.output, enc.letters, text);
        const raw = C.decrypt(key, enc.output, { dummy, delimiter, stripDummy: false });
        assert.equal(raw.output, enc.letters + (enc.padded ? dummy : ''));
      }
    }
  }
});

test('平文の最後が冗字と同じ文字だと警告し、復号の「冗字を外す」を切ると元に戻る', () => {
  const key = demo26();
  const enc = C.encrypt(key, 'AX', { dummy: 'X' });
  assert.deepEqual(enc.warnings.map((w) => w.key), ['warn.endsWithDummy']);
  const dec = C.decrypt(key, enc.output, { dummy: 'X', stripDummy: true });
  assert.equal(dec.output, 'A');
  assert.equal(dec.strippedDummy, true);
  assert.equal(C.decrypt(key, enc.output, { dummy: 'X', stripDummy: false }).output, 'AX');
  // 奇数個で冗字を足したときは警告しない
  assert.equal(C.encrypt(key, 'BOX', { dummy: 'X' }).warnings.length, 0);
  assert.equal(C.decrypt(key, C.encrypt(key, 'BOX', { dummy: 'X' }).output, { dummy: 'X' }).output, 'BOX');
});

test('暗号化のエラー: 鍵なし・英字なし・表にない冗字', () => {
  assert.equal(C.encrypt(null, 'AB', { dummy: 'X' }).error.key, 'error.noKey');
  assert.equal(C.encrypt(demo26(), '123 !?', { dummy: 'X' }).error.key, 'error.noLetters');
  assert.equal(C.encrypt(porta20(), 'ABC', { dummy: 'X' }).error.key, 'error.dummyNotInTable');
});

test('暗号文の読み取り: 区切りの形と誤りの種類', () => {
  assert.deepEqual(C.parseCiphertext(' 123\n456\t789 ', 'space').codes, ['123', '456', '789']);
  assert.equal(C.parseCiphertext('12a 456', 'space').error.key, 'error.badToken');
  assert.equal(C.parseCiphertext('123456', 'space').error.key, 'error.looksConcat');
  assert.deepEqual(C.parseCiphertext('123 456\n789', 'concat').codes, ['123', '456', '789']);
  assert.equal(C.parseCiphertext('12345', 'concat').error.key, 'error.badLength');
  assert.equal(C.parseCiphertext('123x56', 'concat').error.key, 'error.nonDigit');
  assert.equal(C.parseCiphertext('   ', 'space').error.key, 'error.noCodes');
  const fw = String.fromCodePoint(0xff11, 0xff12, 0xff13);
  assert.deepEqual(C.parseCiphertext(fw, 'space').codes, ['123']);
});

test('復号: 表にない数は ?? にして一覧し、予約コードは区別する。そのときは冗字を外さない', () => {
  const key = demo26();
  const he = C.lookup(key, 'H', 'E');
  const dec = C.decrypt(key, `${he} 000`, { dummy: 'X' });
  assert.equal(dec.ok, true);
  assert.equal(dec.output, 'HE??');
  assert.equal(dec.unknown.length, 1);
  assert.equal(dec.unknown[0].reserved, true);
  assert.deepEqual(dec.warnings.map((w) => w.key), ['warn.unknownCodes']);
});

test('通信の模擬: 20文字の表でも Z が残り、奇数個でも届く', () => {
  const k20 = porta20();
  const z = C.simulate(k20, 'ZEBRA YACHT', { dummy: 'Z' });
  assert.equal(z.expected, 'ZEBRAACHT');
  assert.equal(z.match, true);
  assert.deepEqual(z.enc.dropped.filter((d) => d.reason === 'notInTable').map((d) => d.char), ['Y']);
  assert.equal(C.simulate(k20, 'LIBRO', { dummy: 'Z' }).match, true);
  assert.equal(C.simulate(demo26(), 'BOX', { dummy: 'X' }).match, true);
  // 英字が偶数個で最後が冗字と同じだと、受ける側で1文字消える（原理上の曖昧さ）
  const ax = C.simulate(demo26(), 'AX', { dummy: 'X' });
  assert.equal(ax.match, false);
  assert.equal(ax.received, 'A');
});

test('偏りのない選び方（棄却法）', () => {
  assert.equal(C.randomBelow(() => 123456, 1), 0);
  // 2^32 を 3 で割った余りの範囲（上限以上）の値は捨てて引き直す
  const seq = [0xffffffff, 7];
  let i = 0;
  assert.equal(C.randomBelow(() => seq[i++], 3), 1);
  assert.equal(i, 2);
  assert.throws(() => C.randomBelow(() => 0, 0), RangeError);
});

test('暗号用の乱数は crypto.getRandomValues から取る', () => {
  let calls = 0;
  const fake = {
    getRandomValues(buf) {
      calls++;
      for (let i = 0; i < buf.length; i++) buf[i] = i;
      return buf;
    },
  };
  const next = C.cryptoUint32Source(fake);
  assert.equal(next(), 0);
  assert.equal(next(), 1);
  assert.equal(calls, 1);
  assert.throws(() => C.cryptoUint32Source({}), /getRandomValues/);
  const key = C.makeKey(26, ['000', '999'], C.cryptoUint32Source(globalThis.crypto)).key;
  assert.equal(new Set(key.matrix.flat()).size, 676);
});

test('表の生成: 重複なし・予約コードを使わない・数が足りなければエラー', () => {
  for (const size of [20, 26]) {
    const key = C.makeKey(size, ['000', '999'], C.seededUint32Source(`S${size}`)).key;
    const cells = key.matrix.flat();
    assert.equal(cells.length, size * size);
    assert.equal(new Set(cells).size, size * size);
    assert.ok(cells.every((c) => /^[0-9]{3}$/.test(c)));
    assert.ok(!cells.includes('000') && !cells.includes('999'));
    assert.equal(key.alphabet, C.alphabetFor(size));
  }
  const many = Array.from({ length: 400 }, (_, i) => String(i).padStart(3, '0'));
  const r = C.makeKey(26, many, C.seededUint32Source('x'));
  assert.equal(r.ok, false);
  assert.deepEqual(r.error, { key: 'error.notEnoughCodes', params: { need: 676, available: 600 } });
  // シードが違えば表も違う
  const a = C.makeKey(26, [], C.seededUint32Source('a')).key.matrix.flat().join();
  const b = C.makeKey(26, [], C.seededUint32Source('b')).key.matrix.flat().join();
  assert.notEqual(a, b);
});

test('予約コードの入力の読み取り', () => {
  assert.deepEqual(C.parseReserved('000,999').codes, ['000', '999']);
  assert.deepEqual(C.parseReserved('999 000 000').codes, ['000', '999']);
  assert.deepEqual(C.parseReserved('').codes, []);
  const jpSep = '000' + String.fromCodePoint(0x3001) + '999' + String.fromCodePoint(0xff0c) + '500';
  assert.deepEqual(C.parseReserved(jpSep).codes, ['000', '500', '999']);
  assert.equal(C.parseReserved('abc, 12, 1000').error.key, 'error.badReserved');
  assert.deepEqual(C.parseReserved('abc, 12, 1000').error.params, { tokens: 'abc, 12, 1000' });
});

test('鍵の書き出しと読み込み（version 2）', () => {
  const key = demo26();
  const json = C.exportKey(key);
  const data = JSON.parse(json);
  assert.equal(data.format, 'porta-cipherlab-key');
  assert.equal(data.version, 2);
  assert.equal(data.order, 'matrix[first][second]');
  const back = C.importKey(json);
  assert.equal(back.ok, true);
  assert.deepEqual(back.key, key);
});

test('従来の形式（alphabet・reserved・matrix）の鍵も同じ意味で読める', () => {
  const key = porta20();
  const v1 = JSON.stringify({ alphabet: key.alphabet, reserved: key.reserved, matrix: key.matrix });
  const r = C.importKey(v1);
  assert.equal(r.ok, true);
  // 従来のツールは matrix[1文字目][2文字目] で引いていた
  assert.equal(C.lookup(r.key, 'M', 'V'), key.matrix[key.alphabet.indexOf('M')][key.alphabet.indexOf('V')]);
  // alphabet がないものは行の数から決める
  const noAlpha = C.importKey(JSON.stringify({ reserved: [], matrix: key.matrix }));
  assert.equal(noAlpha.key.alphabet, C.ALPHABET_20);
});

test('鍵の読み込みの検証: 壊れた・細工した鍵は拒否する', () => {
  const key = demo26();
  const bad = (mutate) => {
    const d = JSON.parse(C.exportKey(key));
    mutate(d);
    return C.importKey(JSON.stringify(d)).error.key;
  };
  assert.equal(C.importKey('{not json').error.key, 'error.keyNotJson');
  assert.equal(C.importKey('[1,2]').error.key, 'error.keyShape');
  assert.equal(C.importKey('null').error.key, 'error.keyShape');
  assert.equal(C.importKey('x'.repeat(C.LIMITS.keyFileBytes + 1)).error.key, 'error.keyTooLarge');
  assert.equal(bad((d) => { d.matrix[0][0] = '<img src=x onerror=alert(1)>'; }), 'error.keyCell');
  assert.equal(bad((d) => { d.matrix[0][1] = d.matrix[0][0]; }), 'error.keyDuplicate');
  assert.equal(bad((d) => { d.matrix[3][4] = 123; }), 'error.keyCell');
  assert.equal(bad((d) => { d.matrix.pop(); }), 'error.keySize');
  assert.equal(bad((d) => { d.matrix[5].pop(); }), 'error.keySize');
  assert.equal(bad((d) => { d.alphabet = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'; }), 'error.keyAlphabet');
  assert.equal(bad((d) => { d.reserved = [d.matrix[0][0]]; }), 'error.keyReservedClash');
  assert.equal(bad((d) => { d.reserved = ['12']; }), 'error.keyReserved');
  assert.equal(bad((d) => { d.version = 3; }), 'error.keyVersion');
  assert.equal(bad((d) => { d.format = 'other'; }), 'error.keyShape');
  assert.equal(bad((d) => { d.size = 20; }), 'error.keySize');
});

test('画面の表は原典の向き: 上の見出し＝1文字目、横の見出し＝2文字目', () => {
  const key = demo26();
  const rows = C.displayRows(key);
  assert.equal(rows.length, 26);
  const h = key.alphabet.indexOf('H');
  const e = key.alphabet.indexOf('E');
  // H の列と E の行が交わるマス
  assert.deepEqual(rows[e][h], { first: 'H', second: 'E', code: C.lookup(key, 'H', 'E') });
  assert.equal(rows[e][h].code, '583');
  for (let r = 0; r < 26; r++) for (let c = 0; c < 26; c++) assert.equal(rows[r][c].code, key.matrix[c][r]);
});
