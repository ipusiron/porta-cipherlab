// Porta CipherLab（ポルタの二文字式暗号・3桁の数の版）の画面の処理。
// 計算は js/porta-core.js（PortaCore）、文言は js/messages.js（PortaMessages）が受け持つ。
(function () {
  'use strict';

  const C = window.PortaCore;
  const M = window.PortaMessages;
  const { t, tm } = M;
  const $ = (id) => document.getElementById(id);

  // いまの鍵（null か { size, alphabet, reserved, matrix }）と、その出所の説明
  const state = { key: null, source: null };

  // ---- タブ（WAI-ARIA の tabs。左右の矢印・Home・End で移動） ----
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

  function selectTab(tab, focus) {
    for (const other of tabs) {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      other.classList.toggle('active', selected);
      $(other.getAttribute('aria-controls')).hidden = !selected;
    }
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab, false));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });
  selectTab(tabs[0], false);

  // ---- 説明の開閉（? ボタン） ----
  for (const btn of document.querySelectorAll('.help-button')) {
    btn.addEventListener('click', () => {
      const panel = $(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', t(open ? 'help.hide' : 'help.show'));
      panel.hidden = !open;
    });
  }

  // ---- 表示の小道具 ----
  function setStatus(el, text, kind) {
    el.textContent = text;
    el.classList.remove('success', 'error', 'warning');
    if (text && kind) el.classList.add(kind);
  }

  // メッセージ欄に段落を並べる。items は [{ text, kind }]
  function showMessages(el, items) {
    el.replaceChildren();
    for (const item of items) {
      if (!item.text) continue;
      const p = document.createElement('p');
      p.className = `message ${item.kind || ''}`.trim();
      p.textContent = item.text;
      el.appendChild(p);
    }
  }

  let toastTimer = null;
  function showToast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  async function copyFrom(textarea) {
    const text = textarea.value;
    if (!text) {
      showToast(t('toast.nothingToCopy'));
      return;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(t('toast.copied'));
        return;
      }
    } catch (e) {
      // 下の方法を試す
    }
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    showToast(t(ok ? 'toast.copied' : 'toast.copyFailed'));
  }

  // 外した文字・置き換えた文字の一覧（長いときは先頭だけ）
  const LIST_MAX = 30;
  function listText(entries, format) {
    const shown = entries.slice(0, LIST_MAX).map(format);
    if (entries.length > LIST_MAX) shown.push(t('enc.more', { count: entries.length - LIST_MAX }));
    return shown.join(t('list.sep'));
  }
  const droppedItem = (d) => (d.reason === 'space'
    ? t('item.droppedSpace', { pos: d.pos })
    : t('item.dropped', { pos: d.pos, char: d.char, reason: t(`reason.${d.reason}`) }));
  const replacedItem = (r) => t('item.replaced', { pos: r.pos, char: r.char, to: r.to });

  // 組と数の対応を小さな札で並べる
  function showPairs(el, title, rows) {
    el.replaceChildren();
    if (rows.length === 0) return;
    const h = document.createElement('h3');
    h.textContent = title;
    const ol = document.createElement('ol');
    ol.className = 'pair-list';
    for (const [a, b] of rows) {
      const li = document.createElement('li');
      li.textContent = `${a} → ${b}`;
      ol.appendChild(li);
    }
    el.append(h, ol);
  }

  // ---- 鍵 ----
  const sizeSelect = $('matrixSize');

  function sourceText(source) {
    if (!source) return '';
    if (source.type === 'seed') return t('key.sourceSeed', { seed: source.seed });
    if (source.type === 'import') return t('key.sourceImport', { name: source.name });
    return t('key.sourceRandom');
  }

  function updateKeyInfo() {
    const info = $('keyInfo');
    if (!state.key) {
      showMessages(info, [{ text: t('key.none') }]);
      return;
    }
    const { size, reserved } = state.key;
    const items = [{
      text: t('key.info', {
        size, source: sourceText(state.source),
        reserved: reserved.length ? reserved.join(', ') : t('key.reservedNone'),
      }),
    }];
    const selected = Number(sizeSelect.value);
    if (selected !== size) items.push({ text: t('key.sizeMismatch', { selected, size }), kind: 'warning' });
    showMessages(info, items);
  }

  // 表にない文字の扱いは20×20の表のときだけ選べる
  function updateExcludedOption() {
    const is20 = !!state.key && state.key.size === 20;
    $('excludedChars').disabled = !is20;
    $('excludedChars').closest('.input-group').classList.toggle('is-disabled', !is20);
  }

  // 冗字の欄が新しい表の文字でなければ、その表の既定に直す
  function adjustDummies() {
    for (const id of ['dummyChar', 'decryptDummyChar']) {
      const input = $(id);
      if (!C.checkDummy(input.value, state.key.size).ok) input.value = C.DEFAULT_DUMMY[state.key.size];
    }
  }

  function setKey(key, source) {
    state.key = key;
    state.source = source;
    $('btnExport').disabled = false;
    adjustDummies();
    updateExcludedOption();
    updateKeyInfo();
    renderMatrix();
    updateLookup();
    // 表が変わったので、前の表で出した結果は消す
    clearEncryptResult();
    clearDecryptResult();
    clearCommResult();
  }

  function renderMatrix() {
    const wrap = $('matrixDisplay');
    wrap.replaceChildren();
    $('matrixCaption').textContent = state.key ? t('matrix.caption') : '';
    if (!state.key) {
      const p = document.createElement('p');
      p.className = 'matrix-empty';
      p.textContent = t('matrix.empty');
      wrap.appendChild(p);
      return;
    }
    const { alphabet } = state.key;
    const table = document.createElement('table');
    table.className = 'matrix-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.className = 'corner';
    corner.textContent = t('matrix.corner');
    corner.title = t('matrix.cornerTitle');
    headRow.appendChild(corner);
    for (const ch of alphabet) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = 'col-header';
      th.dataset.first = ch;
      th.textContent = ch;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    const tbody = document.createElement('tbody');
    for (const row of C.displayRows(state.key)) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.className = 'row-header';
      th.dataset.second = row[0].second;
      th.textContent = row[0].second;
      tr.appendChild(th);
      for (const cell of row) {
        const td = document.createElement('td');
        td.className = 'matrix-cell';
        td.dataset.first = cell.first;
        td.dataset.second = cell.second;
        td.title = t('matrix.cellLabel', cell);
        td.textContent = cell.code;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.append(thead, tbody);
    wrap.appendChild(table);
  }

  // マスの列（1文字目）と行（2文字目）を強調する
  function highlight(first, second) {
    const wrap = $('matrixDisplay');
    for (const el of wrap.querySelectorAll('.hl-col, .hl-row, .hl-cell')) el.classList.remove('hl-col', 'hl-row', 'hl-cell');
    if (!first || !second) return null;
    for (const el of wrap.querySelectorAll(`[data-first="${first}"]`)) el.classList.add('hl-col');
    for (const el of wrap.querySelectorAll(`[data-second="${second}"]`)) el.classList.add('hl-row');
    const cell = wrap.querySelector(`td[data-first="${first}"][data-second="${second}"]`);
    if (cell) cell.classList.add('hl-cell');
    return cell;
  }

  $('matrixDisplay').addEventListener('mouseover', (e) => {
    const td = e.target.closest('td.matrix-cell');
    if (td) highlight(td.dataset.first, td.dataset.second);
  });
  $('matrixDisplay').addEventListener('mouseleave', () => updateLookup());

  function updateLookup() {
    const out = $('lookupResult');
    const raw = Array.from($('lookupPair').value).map(C.toAsciiUpper).join('');
    if (!state.key) {
      out.textContent = raw ? t('lookup.noKey') : '';
      highlight(null, null);
      return;
    }
    if (raw.length < 2) {
      out.textContent = t('lookup.hint');
      highlight(null, null);
      return;
    }
    const first = raw[0];
    const second = raw[1];
    const code = C.lookup(state.key, first, second);
    if (code === null) {
      out.textContent = t('lookup.notInTable', { chars: raw, alphabet: state.key.alphabet });
      highlight(null, null);
      return;
    }
    out.textContent = t('lookup.result', { first, second, code });
    const cell = highlight(first, second);
    // 表の枠の中だけを横に動かして、そのマスを見せる（ページ全体は動かさない）
    if (cell) {
      const wrap = $('matrixDisplay');
      const x = cell.offsetLeft + cell.offsetParent.offsetLeft;
      wrap.scrollLeft = Math.max(0, x - (wrap.clientWidth - cell.offsetWidth) / 2);
    }
  }
  $('lookupPair').addEventListener('input', updateLookup);

  $('btnGenerate').addEventListener('click', () => {
    const status = $('keyStatus');
    const size = Number(sizeSelect.value);
    const seed = $('seed').value.trim();
    const seedLength = Array.from(seed).length;
    if (seedLength > C.LIMITS.seedChars) {
      setStatus(status, t('error.seedTooLong', { length: seedLength, max: C.LIMITS.seedChars }), 'error');
      return;
    }
    const reserved = C.parseReserved($('reservedCodes').value);
    if (!reserved.ok) {
      setStatus(status, tm(reserved.error), 'error');
      return;
    }
    const next = seed ? C.seededUint32Source(seed) : C.cryptoUint32Source(window.crypto);
    const made = C.makeKey(size, reserved.codes, next);
    if (!made.ok) {
      setStatus(status, tm(made.error), 'error');
      return;
    }
    const source = seed ? { type: 'seed', seed } : { type: 'random' };
    setKey(made.key, source);
    setStatus(status, t('status.generated', { size, cells: size * size, source: sourceText(source) }), 'success');
  });

  sizeSelect.addEventListener('change', updateKeyInfo);

  $('btnImport').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    const status = $('keyStatus');
    if (!file) return;
    if (file.size > C.LIMITS.keyFileBytes) {
      setStatus(status, t('error.keyTooLarge', { max: C.LIMITS.keyFileBytes }), 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = C.importKey(String(reader.result));
      input.value = '';
      if (!r.ok) {
        setStatus(status, tm(r.error), 'error');
        return;
      }
      sizeSelect.value = String(r.key.size);
      setKey(r.key, { type: 'import', name: file.name });
      setStatus(status, t('status.imported', { size: r.key.size, name: file.name }), 'success');
    };
    reader.onerror = () => {
      input.value = '';
      setStatus(status, t('error.fileRead'), 'error');
    };
    reader.readAsText(file);
  });

  $('btnExport').addEventListener('click', () => {
    if (!state.key) return;
    const name = 'porta-key.json';
    const blob = new Blob([C.exportKey(state.key)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus($('keyStatus'), t('status.exported', { name }), 'success');
  });

  // ---- 暗号化 ----
  function clearEncryptResult() {
    $('encryptOutputText').value = '';
    showMessages($('encryptMessages'), []);
    showPairs($('encryptPairs'), '', []);
  }

  $('btnEncrypt').addEventListener('click', () => {
    clearEncryptResult();
    const r = C.encrypt(state.key, $('encryptInputText').value, {
      dummy: $('dummyChar').value,
      delimiter: $('delimiter').value,
      handling20: $('excludedChars').value,
    });
    const msgs = [];
    if (!r.ok) {
      msgs.push({ text: tm(r.error), kind: 'error' });
      showMessages($('encryptMessages'), msgs);
      return;
    }
    $('encryptOutputText').value = r.output;
    msgs.push({ text: t('enc.summary', { letters: r.letters.length, pairs: r.pairs.length }), kind: 'success' });
    if (r.padded) msgs.push({ text: t('enc.padded', { dummy: r.dummy }) });
    if (r.replaced.length) msgs.push({ text: t('enc.replaced', { count: r.replaced.length, list: listText(r.replaced, replacedItem) }) });
    if (r.dropped.length) msgs.push({ text: t('enc.dropped', { count: r.dropped.length, list: listText(r.dropped, droppedItem) }) });
    for (const w of r.warnings) msgs.push({ text: tm(w), kind: 'warning' });
    showMessages($('encryptMessages'), msgs);
    showPairs($('encryptPairs'), t('enc.pairsTitle'), r.pairs.map((p, i) => [p, r.codes[i]]));
  });

  $('btnClearEncrypt').addEventListener('click', () => {
    $('encryptInputText').value = '';
    clearEncryptResult();
  });
  $('btnCopyEncrypt').addEventListener('click', () => copyFrom($('encryptOutputText')));
  // 入力や設定を変えたら、前の結果は消す（古い暗号文が残らないように）
  for (const id of ['encryptInputText', 'dummyChar', 'delimiter', 'excludedChars']) {
    $(id).addEventListener('input', clearEncryptResult);
  }

  // ---- 復号 ----
  function clearDecryptResult() {
    $('decryptOutputText').value = '';
    showMessages($('decryptMessages'), []);
    showPairs($('decryptPairs'), '', []);
  }

  $('btnDecrypt').addEventListener('click', () => {
    clearDecryptResult();
    const r = C.decrypt(state.key, $('decryptInputText').value, {
      dummy: $('decryptDummyChar').value,
      delimiter: $('decryptDelimiter').value,
      stripDummy: $('stripDummy').checked,
    });
    if (!r.ok) {
      showMessages($('decryptMessages'), [{ text: tm(r.error), kind: 'error' }]);
      return;
    }
    $('decryptOutputText').value = r.output;
    const msgs = [{ text: t('dec.summary', { codes: r.items.length, letters: r.output.replace(/\?/g, '').length }), kind: 'success' }];
    for (const w of r.warnings) msgs.push({ text: tm(w), kind: 'warning' });
    showMessages($('decryptMessages'), msgs);
    showPairs($('decryptPairs'), t('dec.pairsTitle'), r.items.map((it) => [it.code, it.pair || (it.reserved ? `?? ${t('warn.reservedCode')}` : '??')]));
  });

  $('btnClearDecrypt').addEventListener('click', () => {
    $('decryptInputText').value = '';
    clearDecryptResult();
  });
  $('btnCopyDecrypt').addEventListener('click', () => copyFrom($('decryptOutputText')));
  for (const id of ['decryptInputText', 'decryptDummyChar', 'decryptDelimiter', 'stripDummy']) {
    $(id).addEventListener(id === 'stripDummy' ? 'change' : 'input', clearDecryptResult);
  }

  // ---- 通信シミュレーター ----
  function clearCommResult() {
    for (const id of ['commPlaintext', 'commCiphertext', 'commDecrypted']) $(id).textContent = '';
    setStatus($('commStatus'), '', null);
  }

  $('btnSimulate').addEventListener('click', () => {
    clearCommResult();
    const status = $('commStatus');
    const text = $('commInput').value;
    if (!text.trim()) {
      setStatus(status, t('comm.noInput'), 'warning');
      return;
    }
    if (!state.key) {
      setStatus(status, t('error.noKey'), 'error');
      return;
    }
    const dummy = C.DEFAULT_DUMMY[state.key.size];
    const r = C.simulate(state.key, text, { dummy, handling20: 'replace' });
    if (!r.ok) {
      setStatus(status, tm(r.error), 'error');
      return;
    }
    const { enc, dec } = r;
    const step1 = [t('comm.step1', { text, letters: enc.letters })];
    if (enc.replaced.length) step1.push(t('comm.step1Replaced', { list: listText(enc.replaced, replacedItem) }));
    if (enc.dropped.length) step1.push(t('comm.step1Dropped', { count: enc.dropped.length, list: listText(enc.dropped, droppedItem) }));
    const target = enc.pairs.join('');
    if (enc.padded) step1.push(t('comm.step1Padded', { dummy: enc.dummy, letters: target }));
    step1.push(t('comm.step1Result', { letters: target }));
    $('commPlaintext').textContent = step1.join('\n');

    const step2 = [t('comm.step2Title')];
    enc.pairs.forEach((p, i) => step2.push(t('comm.step2Line', { pair: p, code: enc.codes[i] })));
    step2.push(t('comm.step2Result', { data: r.transmitted }));
    $('commCiphertext').textContent = step2.join('\n');

    const step3 = [t('comm.step3Title', { data: r.transmitted })];
    for (const it of dec.items) step3.push(t('comm.step3Line', { code: it.code, pair: it.pair || '??' }));
    if (dec.strippedDummy) step3.push(t('comm.step3Stripped', { dummy: dec.dummy, letters: dec.output }));
    step3.push(t('comm.step3Result', { letters: dec.output }));
    $('commDecrypted').textContent = step3.join('\n');

    if (r.match) {
      const lines = [t('comm.success')];
      if (enc.replaced.length) lines.push(t('comm.noteReplaced', { count: enc.replaced.length }));
      if (enc.dropped.length) lines.push(t('comm.noteLost', { count: enc.dropped.length }));
      setStatus(status, lines.join(''), 'success');
    } else {
      const lines = [t('comm.mismatch', { expected: r.expected, received: r.received })];
      for (const w of enc.warnings) lines.push(tm(w));
      setStatus(status, lines.join(' '), 'warning');
    }
  });

  $('btnClearComm').addEventListener('click', () => {
    $('commInput').value = '';
    clearCommResult();
  });
  $('commInput').addEventListener('input', clearCommResult);

  // ---- 座学: ポルタの例文を暗号化タブへ ----
  const PORTA_EXAMPLE = 'MVLTIS CLADIBVS VLTRO CITROQVE DATIS ET ACCEPTIS, VNIVERSA PENE CIVITAS OCCVPATA EST, '
    + 'RELIQVA NON SCRIBAM, SED IN CONGRESSVM NOSTRVM RESERVABO.';
  $('btnUseExample').addEventListener('click', () => {
    $('encryptInputText').value = PORTA_EXAMPLE;
    clearEncryptResult();
    selectTab($('tab-encrypt'), true);
  });

  // ---- 初期表示 ----
  updateKeyInfo();
  updateExcludedOption();
  renderMatrix();
  updateLookup();
})();
