// Porta CipherLab の計算部（DOM に依存しない通常のスクリプト。globalThis.PortaCore に置く）
// ポルタの二文字式暗号（1563年）: 平文を2文字ずつに区切り、表の1マス（ここでは3桁の数）に置き換える。
// 表の引き方は原典どおり、1文字目＝上の見出し（列）、2文字目＝横の見出し（行）。
// 鍵のデータは matrix[1文字目][2文字目] の形で持つ（従来の書き出し形式と同じ意味）。
// 画面に出す文言は持たず、{ key, params } の形で返す（文言は js/messages.js）。
(function (root) {
  'use strict';

  // 原典の20文字（J・K・U・W・X・Y がない。1番目が A、20番目が Z）と、全アルファベット
  const ALPHABET_20 = 'ABCDEFGHILMNOPQRSTVZ';
  const ALPHABET_26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ALPHABETS = { 20: ALPHABET_20, 26: ALPHABET_26 };
  // 20文字の表で、当時の綴りに合わせて置き換える文字（I と J、U と V は同じ文字として扱われていた）
  const REPLACE_20 = { J: 'I', U: 'V', W: 'VV' };
  // 冗字（英字が奇数個のとき最後に足す文字）の既定。どちらも表にある文字
  const DEFAULT_DUMMY = { 20: 'Z', 26: 'X' };
  const DEFAULT_RESERVED = ['000', '999'];
  const CODE_COUNT = 1000;
  const LIMITS = { textChars: 10000, seedChars: 200, reservedCodes: 300, keyFileBytes: 200000 };
  const KEY_FORMAT = 'porta-cipherlab-key';

  const msg = (key, params) => (params ? { key, params } : { key });

  function alphabetFor(size) {
    const a = ALPHABETS[size];
    if (!a) throw new RangeError('size must be 20 or 26');
    return a;
  }

  function sizeOfAlphabet(alphabet) {
    if (alphabet === ALPHABET_20) return 20;
    if (alphabet === ALPHABET_26) return 26;
    return 0;
  }

  // 全角英字（Ａ〜Ｚ・ａ〜ｚ）を半角に、小文字を大文字にする。それ以外はそのまま返す
  function toAsciiUpper(ch) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x61 && cp <= 0x7a) return String.fromCharCode(cp - 0x20);
    if (cp >= 0xff21 && cp <= 0xff3a) return String.fromCharCode(cp - 0xff21 + 0x41);
    if (cp >= 0xff41 && cp <= 0xff5a) return String.fromCharCode(cp - 0xff41 + 0x41);
    return ch;
  }

  function charKind(ch) {
    if (/^\s$/u.test(ch)) return 'space';
    if (/^\p{Nd}$/u.test(ch)) return 'digit';
    return 'symbol';
  }

  // 平文から表で使う英字の列を作る。外した文字と置き換えた文字は位置（1から数えた文字の番号）つきで返す
  // options.handling20: 'replace'（J→I・U→V・W→VV、K・X・Y は外す）／'drop'（表にない英字はすべて外す）
  function normalizeText(text, size, options) {
    const alphabet = alphabetFor(size);
    const handling = (options && options.handling20) || 'replace';
    const chars = Array.from(String(text));
    if (chars.length > LIMITS.textChars) {
      return { ok: false, error: msg('error.tooLong', { max: LIMITS.textChars, length: chars.length }) };
    }
    let letters = '';
    const dropped = [];
    const replaced = [];
    chars.forEach((raw, i) => {
      const pos = i + 1;
      const ch = toAsciiUpper(raw);
      if (!/^[A-Z]$/.test(ch)) {
        dropped.push({ pos, char: raw, reason: charKind(raw) });
        return;
      }
      if (alphabet.includes(ch)) {
        letters += ch;
        return;
      }
      if (size === 20 && handling === 'replace' && REPLACE_20[ch]) {
        letters += REPLACE_20[ch];
        replaced.push({ pos, char: raw, to: REPLACE_20[ch] });
        return;
      }
      dropped.push({ pos, char: raw, reason: 'notInTable' });
    });
    return { ok: true, letters, dropped, replaced, inputLength: chars.length };
  }

  // 英字の列を2文字ずつに区切る。奇数個なら冗字を1つ足す
  function toPairs(letters, dummy) {
    let s = letters;
    const padded = s.length % 2 === 1;
    if (padded) s += dummy;
    const pairs = [];
    for (let i = 0; i < s.length; i += 2) pairs.push(s.slice(i, i + 2));
    return { pairs, padded };
  }

  function checkDummy(dummy, size) {
    const d = toAsciiUpper(String(dummy || ''));
    if (d.length !== 1 || !alphabetFor(size).includes(d)) {
      return { ok: false, error: msg('error.dummyNotInTable', { dummy: String(dummy || ''), alphabet: alphabetFor(size) }) };
    }
    return { ok: true, dummy: d };
  }

  function lookup(key, first, second) {
    const r = key.alphabet.indexOf(first);
    const c = key.alphabet.indexOf(second);
    if (r < 0 || c < 0) return null;
    return key.matrix[r][c];
  }

  // 3桁の数 → 2文字の組
  function reverseIndex(key) {
    const map = new Map();
    for (let r = 0; r < key.size; r++) {
      for (let c = 0; c < key.size; c++) map.set(key.matrix[r][c], key.alphabet[r] + key.alphabet[c]);
    }
    return map;
  }

  // 暗号化。options: { delimiter: 'space'|'concat', dummy, handling20 }
  function encrypt(key, text, options) {
    const opt = options || {};
    if (!key) return { ok: false, error: msg('error.noKey') };
    const d = checkDummy(opt.dummy, key.size);
    if (!d.ok) return d;
    const norm = normalizeText(text, key.size, opt);
    if (!norm.ok) return norm;
    if (norm.letters.length === 0) {
      return { ok: false, error: msg('error.noLetters'), dropped: norm.dropped, replaced: norm.replaced };
    }
    const { pairs, padded } = toPairs(norm.letters, d.dummy);
    const codes = pairs.map((p) => lookup(key, p[0], p[1]));
    const warnings = [];
    // 英字が偶数個で最後が冗字と同じ文字だと、復号で「末尾の冗字を外す」とその文字が消える
    if (!padded && norm.letters.endsWith(d.dummy)) warnings.push(msg('warn.endsWithDummy', { dummy: d.dummy }));
    const output = codes.join(opt.delimiter === 'concat' ? '' : ' ');
    return {
      ok: true, output, codes, pairs, padded, dummy: d.dummy,
      letters: norm.letters, dropped: norm.dropped, replaced: norm.replaced, warnings,
    };
  }

  // 全角数字を半角に
  function toAsciiDigits(s) {
    return Array.from(s, (ch) => {
      const cp = ch.codePointAt(0);
      return cp >= 0xff10 && cp <= 0xff19 ? String.fromCharCode(cp - 0xff10 + 0x30) : ch;
    }).join('');
  }

  // 暗号文を3桁の数の列に分ける。delimiter: 'space'（空白・改行で区切る）／'concat'（空白を無視して3桁ずつ）
  function parseCiphertext(text, delimiter) {
    const s = toAsciiDigits(String(text));
    if (Array.from(s).length > LIMITS.textChars) {
      return { ok: false, error: msg('error.tooLong', { max: LIMITS.textChars, length: Array.from(s).length }) };
    }
    if (delimiter === 'concat') {
      const compact = s.replace(/\s+/gu, '');
      if (compact.length === 0) return { ok: false, error: msg('error.noCodes') };
      const bad = Array.from(compact).findIndex((ch) => !/[0-9]/.test(ch));
      if (bad >= 0) return { ok: false, error: msg('error.nonDigit', { pos: bad + 1, char: Array.from(compact)[bad] }) };
      if (compact.length % 3 !== 0) {
        return { ok: false, error: msg('error.badLength', { length: compact.length, rest: compact.length % 3 }) };
      }
      const codes = [];
      for (let i = 0; i < compact.length; i += 3) codes.push(compact.slice(i, i + 3));
      return { ok: true, codes };
    }
    const tokens = s.split(/\s+/u).filter((t) => t.length > 0);
    if (tokens.length === 0) return { ok: false, error: msg('error.noCodes') };
    const badIndex = tokens.findIndex((t) => !/^[0-9]{3}$/.test(t));
    if (badIndex >= 0) {
      const token = tokens[badIndex];
      const looksConcat = /^[0-9]+$/.test(token) && token.length > 3 && token.length % 3 === 0;
      return {
        ok: false,
        error: msg(looksConcat ? 'error.looksConcat' : 'error.badToken', { index: badIndex + 1, token: token.slice(0, 20) }),
      };
    }
    return { ok: true, codes: tokens };
  }

  // 復号。options: { delimiter, dummy, stripDummy }
  function decrypt(key, text, options) {
    const opt = options || {};
    if (!key) return { ok: false, error: msg('error.noKey') };
    const d = checkDummy(opt.dummy, key.size);
    if (!d.ok) return d;
    const parsed = parseCiphertext(text, opt.delimiter);
    if (!parsed.ok) return parsed;
    const rev = reverseIndex(key);
    const reserved = new Set(key.reserved);
    const items = parsed.codes.map((code, i) => {
      const pair = rev.get(code) || null;
      return { index: i + 1, code, pair, reserved: !pair && reserved.has(code) };
    });
    const unknown = items.filter((it) => !it.pair);
    let letters = items.map((it) => it.pair || '??').join('');
    let strippedDummy = false;
    if (opt.stripDummy !== false && unknown.length === 0 && letters.endsWith(d.dummy)) {
      letters = letters.slice(0, -1);
      strippedDummy = true;
    }
    const warnings = [];
    if (unknown.length > 0) {
      warnings.push(msg('warn.unknownCodes', {
        count: unknown.length,
        list: unknown.slice(0, 10).map((it) => `${it.index}:${it.code}`).join(', '),
      }));
    }
    if (strippedDummy) warnings.push(msg('warn.strippedDummy', { dummy: d.dummy }));
    return { ok: true, output: letters, items, unknown, strippedDummy, dummy: d.dummy, warnings };
  }

  // 送る側（暗号化）→ 数字の列（連結）→ 受ける側（復号）を通しで行い、届いた英字を比べる
  function simulate(key, text, options) {
    const opt = Object.assign({ handling20: 'replace' }, options || {});
    const enc = encrypt(key, text, { delimiter: 'concat', dummy: opt.dummy, handling20: opt.handling20 });
    if (!enc.ok) return { ok: false, error: enc.error, enc };
    const dec = decrypt(key, enc.output, { delimiter: 'concat', dummy: opt.dummy, stripDummy: true });
    if (!dec.ok) return { ok: false, error: dec.error, enc, dec };
    const match = dec.output === enc.letters;
    return { ok: true, enc, dec, transmitted: enc.output, expected: enc.letters, received: dec.output, match };
  }

  // ---- 乱数 ----

  // 暗号用の乱数（crypto.getRandomValues）。32ビットの整数を返す関数を作る
  function cryptoUint32Source(cryptoObj) {
    const c = cryptoObj || root.crypto;
    if (!c || typeof c.getRandomValues !== 'function') throw new Error('crypto.getRandomValues is not available');
    const buf = new Uint32Array(64);
    let i = buf.length;
    return () => {
      if (i >= buf.length) {
        c.getRandomValues(buf);
        i = 0;
      }
      return buf[i++];
    };
  }

  // シード文字列から128ビットの状態を作るハッシュ（cyrb128）
  function cyrb128(str) {
    let h1 = 1779033703;
    let h2 = 3144134277;
    let h3 = 1013904242;
    let h4 = 2773480762;
    for (let i = 0; i < str.length; i++) {
      const k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= h2 ^ h3 ^ h4;
    h2 ^= h1;
    h3 ^= h1;
    h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }

  // 128ビットの状態を持つ擬似乱数（sfc32）。同じシードからは同じ列が出る（暗号用ではない）
  function seededUint32Source(seed) {
    let [a, b, c, d] = cyrb128(String(seed).normalize('NFC'));
    return () => {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      const t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      const out = (t + d) | 0;
      c = (c + out) | 0;
      return out >>> 0;
    };
  }

  // 0 以上 n 未満の整数を偏りなく選ぶ（棄却法）
  function randomBelow(next, n) {
    if (!(n > 0 && n <= 0x100000000)) throw new RangeError('n out of range');
    const limit = Math.floor(0x100000000 / n) * n;
    for (;;) {
      const x = next();
      if (x < limit) return x % n;
    }
  }

  // ---- 鍵 ----

  // 予約コードの区切りに使える全角の記号（読点 U+3001・全角カンマ U+FF0C）
  const RESERVED_SEPARATORS = [0x3001, 0xff0c].map((cp) => String.fromCodePoint(cp));

  // 予約コードの入力（カンマ・読点・空白で区切る）を読む
  function parseReserved(text) {
    let s = toAsciiDigits(String(text || ''));
    for (const sep of RESERVED_SEPARATORS) s = s.split(sep).join(',');
    const tokens = s.split(/[\s,]+/u).filter((t) => t.length > 0);
    const bad = tokens.filter((t) => !/^[0-9]{3}$/.test(t));
    if (bad.length > 0) return { ok: false, error: msg('error.badReserved', { tokens: bad.slice(0, 5).join(', ') }) };
    const codes = Array.from(new Set(tokens)).sort();
    if (codes.length > LIMITS.reservedCodes) {
      return { ok: false, error: msg('error.tooManyReserved', { count: codes.length, max: LIMITS.reservedCodes }) };
    }
    return { ok: true, codes };
  }

  // 表を作る。next は32ビットの整数を返す関数（cryptoUint32Source か seededUint32Source）
  function makeKey(size, reservedCodes, next) {
    const alphabet = alphabetFor(size);
    const reserved = Array.from(new Set(reservedCodes || [])).sort();
    const reservedSet = new Set(reserved);
    const available = [];
    for (let i = 0; i < CODE_COUNT; i++) {
      const code = String(i).padStart(3, '0');
      if (!reservedSet.has(code)) available.push(code);
    }
    if (available.length < size * size) {
      return { ok: false, error: msg('error.notEnoughCodes', { need: size * size, available: available.length }) };
    }
    // Fisher–Yates で並べ替え、先頭から size×size 個を使う
    for (let i = available.length - 1; i > 0; i--) {
      const j = randomBelow(next, i + 1);
      [available[i], available[j]] = [available[j], available[i]];
    }
    const matrix = [];
    for (let r = 0; r < size; r++) matrix.push(available.slice(r * size, (r + 1) * size));
    return { ok: true, key: { size, alphabet, reserved, matrix } };
  }

  // 書き出す JSON（version 2）。matrix[1文字目][2文字目] の意味は従来の形式と同じ
  function exportKey(key) {
    return JSON.stringify({
      format: KEY_FORMAT,
      version: 2,
      size: key.size,
      alphabet: key.alphabet,
      order: 'matrix[first][second]',
      reserved: key.reserved,
      matrix: key.matrix,
    }, null, 2);
  }

  // 読み込んだ JSON を検証して鍵にする。従来の形式（alphabet・reserved・matrix だけ）も読む
  function importKey(jsonText) {
    if (typeof jsonText !== 'string' || jsonText.length > LIMITS.keyFileBytes) {
      return { ok: false, error: msg('error.keyTooLarge', { max: LIMITS.keyFileBytes }) };
    }
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      return { ok: false, error: msg('error.keyNotJson') };
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: msg('error.keyShape') };
    if (data.format !== undefined && data.format !== KEY_FORMAT) return { ok: false, error: msg('error.keyShape') };
    if (data.version !== undefined && data.version !== 2) return { ok: false, error: msg('error.keyVersion') };
    const matrix = data.matrix;
    if (!Array.isArray(matrix) || (matrix.length !== 20 && matrix.length !== 26)) {
      return { ok: false, error: msg('error.keySize') };
    }
    const size = matrix.length;
    // 従来の形式で alphabet がないものは、行の数から決める
    const alphabet = data.alphabet === undefined ? alphabetFor(size) : data.alphabet;
    if (sizeOfAlphabet(alphabet) !== size) return { ok: false, error: msg('error.keyAlphabet') };
    if (data.size !== undefined && data.size !== size) return { ok: false, error: msg('error.keySize') };
    const seen = new Set();
    for (let r = 0; r < size; r++) {
      const row = matrix[r];
      if (!Array.isArray(row) || row.length !== size) return { ok: false, error: msg('error.keySize') };
      for (let c = 0; c < size; c++) {
        const v = row[c];
        if (typeof v !== 'string' || !/^[0-9]{3}$/.test(v)) {
          return { ok: false, error: msg('error.keyCell', { pair: alphabet[r] + alphabet[c] }) };
        }
        if (seen.has(v)) return { ok: false, error: msg('error.keyDuplicate', { code: v }) };
        seen.add(v);
      }
    }
    const reservedRaw = data.reserved === undefined ? [] : data.reserved;
    if (!Array.isArray(reservedRaw) || reservedRaw.some((v) => typeof v !== 'string' || !/^[0-9]{3}$/.test(v))) {
      return { ok: false, error: msg('error.keyReserved') };
    }
    const reserved = Array.from(new Set(reservedRaw)).sort();
    const clash = reserved.find((v) => seen.has(v));
    if (clash) return { ok: false, error: msg('error.keyReservedClash', { code: clash }) };
    return { ok: true, key: { size, alphabet, reserved, matrix: matrix.map((row) => row.slice()) } };
  }

  // 画面の表（原典の向き）: 行＝2文字目、列＝1文字目。rows[行][列] = { first, second, code }
  function displayRows(key) {
    const rows = [];
    for (let second = 0; second < key.size; second++) {
      const row = [];
      for (let first = 0; first < key.size; first++) {
        row.push({ first: key.alphabet[first], second: key.alphabet[second], code: key.matrix[first][second] });
      }
      rows.push(row);
    }
    return rows;
  }

  // ---- 原典の記号（1563年初版 p.90 の表から切り出した400個） ----

  // assets/porta1563_symbols.png の並び: 列＝1文字目（上の見出し）、行＝2文字目（右の見出し）。1マスは52×64px
  const SYMBOL_SPRITE = { file: 'assets/porta1563_symbols.png', cols: 20, rows: 20, tileW: 52, tileH: 64 };

  // ポルタ自身の例文（第2巻第13章 p.91）と、刷られた暗号文の行ごとの記号の数
  const PORTA_EXAMPLE = 'MVLTIS CLADIBVS VLTRO CITROQVE DATIS ET ACCEPTIS, VNIVERSA PENE CIVITAS OCCVPATA EST, '
    + 'RELIQVA NON SCRIBAM, SED IN CONGRESSVM NOSTRVM RESERVABO.';
  const PORTA_EXAMPLE_LINES = [15, 12, 15, 13, 5];

  // 2文字の組 → スプライトの列と行（20文字の表にない文字なら null）
  function symbolCell(pair) {
    if (typeof pair !== 'string' || pair.length !== 2) return null;
    const col = ALPHABET_20.indexOf(pair[0]);
    const row = ALPHABET_20.indexOf(pair[1]);
    if (col < 0 || row < 0) return null;
    return { pair, col, row };
  }

  // スプライトの列と行 → 2文字の組
  function pairFromCell(col, row) {
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || row < 0 || col >= 20 || row >= 20) return null;
    return ALPHABET_20[col] + ALPHABET_20[row];
  }

  // 原典の記号で暗号化する。表は20文字の原典の表に固定。options: { dummy, handling20 }
  function encryptSymbols(text, options) {
    const opt = options || {};
    const d = checkDummy(opt.dummy === undefined ? DEFAULT_DUMMY[20] : opt.dummy, 20);
    if (!d.ok) return d;
    const norm = normalizeText(text, 20, opt);
    if (!norm.ok) return norm;
    if (norm.letters.length === 0) {
      return { ok: false, error: msg('error.noLetters'), dropped: norm.dropped, replaced: norm.replaced };
    }
    const { pairs, padded } = toPairs(norm.letters, d.dummy);
    const cells = pairs.map(symbolCell);
    const warnings = [];
    if (!padded && norm.letters.endsWith(d.dummy)) warnings.push(msg('warn.endsWithDummy', { dummy: d.dummy }));
    return {
      ok: true, cells, pairs, padded, dummy: d.dummy,
      letters: norm.letters, dropped: norm.dropped, replaced: norm.replaced, warnings,
    };
  }

  // 選んだ記号（{ col, row } の列）を英字に戻す。末尾の冗字を外すかは stripDummy
  function decodeSymbols(cells, options) {
    const opt = options || {};
    const pairs = (cells || []).map((c) => pairFromCell(c.col, c.row));
    if (pairs.some((p) => p === null)) return { ok: false, error: msg('error.badSymbol') };
    let letters = pairs.join('');
    const dummy = toAsciiUpper(String(opt.dummy === undefined ? DEFAULT_DUMMY[20] : opt.dummy));
    let strippedDummy = false;
    if (opt.stripDummy && letters.length > 0 && letters.endsWith(dummy)) {
      letters = letters.slice(0, -1);
      strippedDummy = true;
    }
    return { ok: true, pairs, letters, strippedDummy };
  }

  // 並びを行に分ける（counts の数ずつ。余りは最後の行に続ける）
  function splitLines(items, counts) {
    const lines = [];
    let i = 0;
    for (const n of counts) {
      if (i >= items.length) break;
      lines.push(items.slice(i, i + n));
      i += n;
    }
    if (i < items.length) lines.push(items.slice(i));
    return lines;
  }

  root.PortaCore = {
    ALPHABET_20, ALPHABET_26, ALPHABETS, REPLACE_20, DEFAULT_DUMMY, DEFAULT_RESERVED, CODE_COUNT, LIMITS, KEY_FORMAT,
    alphabetFor, sizeOfAlphabet, toAsciiUpper, normalizeText, toPairs, checkDummy, lookup, reverseIndex,
    encrypt, parseCiphertext, decrypt, simulate,
    cryptoUint32Source, cyrb128, seededUint32Source, randomBelow,
    parseReserved, makeKey, exportKey, importKey, displayRows,
    SYMBOL_SPRITE, PORTA_EXAMPLE, PORTA_EXAMPLE_LINES, symbolCell, pairFromCell, encryptSymbols, decodeSymbols, splitLines,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
