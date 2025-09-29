// Porta CipherLab (連字暗号・3桁乱数版)

// アルファベット定義
const alphabet20 = "ABCDEFGHILMNOPQRSTVZ"; // 20文字（J,K,U,W,X,Zを除外）
const alphabet26 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 26文字（全アルファベット）
let currentAlphabet = alphabet26; // デフォルトは26×26
let matrix = []; // マトリクス表
let reserved = ["000","999"];

// シード付き疑似乱数生成器（Linear Congruential Generator）
class SeededRandom {
  constructor(seed) {
    this.seed = this.hashString(seed || Date.now().toString());
  }

  // 文字列をハッシュ化して数値シードに変換
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }

  // 疑似乱数生成（0以上1未満）
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // 指定範囲の整数を生成
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

// タブ切り替え
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    // すべてのタブとボタンから active クラスを削除
    document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));

    // クリックされたタブを表示し、ボタンに active クラスを追加
    document.getElementById(btn.dataset.tab).style.display = "block";
    btn.classList.add("active");
  });
});

// デフォルト表示（置換表生成タブとそのボタンをアクティブに）
document.getElementById("keygen").style.display = "block";
document.querySelector('[data-tab="keygen"]').classList.add("active");

// マトリクスサイズ変更時の除外文字オプション制御
function updateExcludedCharsOption() {
  const matrixSize = parseInt(document.getElementById("matrixSize").value);
  const excludedCharsSelect = document.getElementById("excludedChars");
  const excludedCharsGroup = excludedCharsSelect.closest('.input-group');

  if (matrixSize === 26) {
    excludedCharsSelect.disabled = true;
    excludedCharsGroup.style.opacity = '0.5';
  } else {
    excludedCharsSelect.disabled = false;
    excludedCharsGroup.style.opacity = '1';
  }
}

// 初期状態の設定
updateExcludedCharsOption();

// マトリクスサイズ変更イベント
document.getElementById("matrixSize").addEventListener("change", updateExcludedCharsOption);

// 置換表生成
function generateMatrix() {
  // 選択されたサイズを取得
  const size = parseInt(document.getElementById("matrixSize").value);
  currentAlphabet = size === 20 ? alphabet20 : alphabet26;

  const seedValue = document.getElementById("seed").value.trim();
  reserved = document.getElementById("reservedCodes").value.split(",").map(s => s.trim());

  const totalCells = size * size;
  const codes = [];

  // シード付き乱数生成器を初期化
  let rng;
  if (seedValue) {
    rng = new SeededRandom(seedValue);
  } else {
    rng = new SeededRandom(Date.now().toString());
  }

  // 利用可能なコード番号をシャッフルして選択
  const availableCodes = [];
  for (let i = 0; i < 1000; i++) {
    const code = String(i).padStart(3, "0");
    if (!reserved.includes(code)) {
      availableCodes.push(code);
    }
  }

  // Fisher-Yates シャッフル（シード付き）
  for (let i = availableCodes.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [availableCodes[i], availableCodes[j]] = [availableCodes[j], availableCodes[i]];
  }

  // 必要な分だけ選択
  const selectedCodes = availableCodes.slice(0, totalCells);

  if (selectedCodes.length < totalCells) {
    const statusEl = document.getElementById("keyStatus");
    statusEl.textContent = `エラー: 利用可能なコードが不足しています (必要:${totalCells}, 利用可能:${selectedCodes.length})`;
    statusEl.className = "error";
    return;
  }

  // マトリクス作成
  matrix = [];
  for (let i = 0; i < size; i++) {
    matrix.push(selectedCodes.slice(i * size, (i + 1) * size));
  }

  renderMatrix();
  const statusEl = document.getElementById("keyStatus");
  let statusText = `${totalCells}ユニークコード生成完了 (${size}×${size}マトリクス)`;
  if (seedValue) {
    statusText += ` - シード: "${seedValue}"`;
  } else {
    statusText += ` - ランダム生成`;
  }
  statusEl.textContent = statusText;
  statusEl.className = "success";
}

function renderMatrix() {
  if (matrix.length === 0) return;

  const size = matrix.length;
  const container = document.getElementById("matrixDisplay");

  // テーブルを作成
  let html = '<table class="matrix-table">';

  // ヘッダー行
  html += '<thead><tr><th></th>';
  for (let i = 0; i < size; i++) {
    html += `<th class="col-header">${currentAlphabet[i]}</th>`;
  }
  html += '</tr></thead><tbody>';

  // データ行
  for (let r = 0; r < size; r++) {
    html += `<tr>`;
    html += `<th class="row-header">${currentAlphabet[r]}</th>`;
    for (let c = 0; c < size; c++) {
      html += `<td data-row="${r}" data-col="${c}" class="matrix-cell">${matrix[r][c]}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';

  container.innerHTML = html;

  // ホバーイベントを追加
  addMatrixHoverEffects();
}

function addMatrixHoverEffects() {
  const cells = document.querySelectorAll('.matrix-cell');

  cells.forEach(cell => {
    cell.addEventListener('mouseenter', function() {
      const row = this.getAttribute('data-row');
      const col = this.getAttribute('data-col');

      // 同じ行のすべてのセルをハイライト
      document.querySelectorAll(`[data-row="${row}"]`).forEach(c => {
        c.classList.add('row-highlight');
      });

      // 同じ列のすべてのセルをハイライト
      document.querySelectorAll(`[data-col="${col}"]`).forEach(c => {
        c.classList.add('col-highlight');
      });

      // 現在のセルを強調
      this.classList.add('cell-highlight');

      // ヘッダーをハイライト
      const table = this.closest('table');
      table.querySelectorAll('.row-header')[row].classList.add('header-highlight');
      table.querySelectorAll('.col-header')[col].classList.add('header-highlight');
    });

    cell.addEventListener('mouseleave', function() {
      // すべてのハイライトを削除
      document.querySelectorAll('.row-highlight, .col-highlight, .cell-highlight, .header-highlight').forEach(c => {
        c.classList.remove('row-highlight', 'col-highlight', 'cell-highlight', 'header-highlight');
      });
    });
  });
}

// エクスポート
function exportKey(){
  const blob = new Blob([JSON.stringify({alphabet:currentAlphabet,reserved,matrix},null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download="porta-key.json";
  a.click();
  URL.revokeObjectURL(url);
}

// インポート
function importKey(e){
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(){
    const data = JSON.parse(reader.result);
    matrix = data.matrix;
    reserved = data.reserved;
    currentAlphabet = data.alphabet || alphabet20; // 互換性のため

    // UIのマトリクスサイズを更新
    const size = currentAlphabet.length;
    document.getElementById("matrixSize").value = size.toString();

    renderMatrix();
    const statusEl = document.getElementById("keyStatus");
    statusEl.textContent=`置換表読み込み完了 (${size}×${size}マトリクス)`;
    statusEl.className = "success";
  }
  reader.readAsText(file);
}

// 暗号化
function encryptText(){
  if(matrix.length===0){ alert("置換表を生成してください"); return; }

  let txt = document.getElementById("encryptInputText").value.toUpperCase();
  const excludedOpt = document.getElementById("excludedChars").value;
  const nonAlphaOpt = document.getElementById("nonAlpha").value;
  const numbersOpt = document.getElementById("numbers").value;
  const dummy = document.getElementById("dummyChar").value.toUpperCase() || "X";

  // 20×20で除外される文字
  const excludedChars = "JKUWXZ";

  let processedTxt = "";
  let skipChars = "";

  for(let char of txt) {
    // 数字の処理
    if(/[0-9]/.test(char)) {
      if(numbersOpt === "keep") {
        skipChars += char;
      }
      continue;
    }

    // アルファベット以外の文字の処理
    if(!/[A-Z]/.test(char)) {
      if(nonAlphaOpt === "keep") {
        skipChars += char;
      }
      continue;
    }

    // 20×20モードで除外文字の処理
    if(currentAlphabet === alphabet20 && excludedChars.includes(char)) {
      if(excludedOpt === "keep") {
        skipChars += char;
      }
      continue;
    }

    // 暗号化対象の文字
    processedTxt += char;
  }

  // パディング処理
  if(processedTxt.length%2===1) processedTxt += dummy;

  let codes = [];

  // 暗号化処理
  for(let i=0;i<processedTxt.length;i+=2){
    let r = currentAlphabet.indexOf(processedTxt[i]);
    let c = currentAlphabet.indexOf(processedTxt[i+1]);
    if(r<0||c<0){
      codes.push("???");
      continue;
    }
    codes.push(matrix[r][c]);
  }

  // 区切り文字の処理
  const delim = document.getElementById("delimiter").value;
  let result = "";

  if(delim === "space") {
    result = codes.join(" ");
  } else {
    result = codes.join("");
  }

  // スキップ文字を最後に追加（簡略化）
  if(skipChars) {
    result += skipChars;
  }

  document.getElementById("encryptOutputText").value = result;
}

// 復号
function decryptText(){
  if(matrix.length===0){ alert("置換表を生成してください"); return; }

  let txt = document.getElementById("decryptInputText").value;
  const delim = document.getElementById("decryptDelimiter").value;

  let result = "";
  let i = 0;

  while(i < txt.length) {
    const char = txt[i];

    // 非暗号文字の処理
    if(delim === "concat") {
      // 連結モードでは3桁の数字以外をチェック
      if(!/[0-9]/.test(char) || (i+2 < txt.length && !/^[0-9]{3}$/.test(txt.substr(i, 3)))) {
        // 数字でない、または3桁の数字でない場合
        // 復号では文字処理オプションは使用しない（シンプルに）
        result += char;
        i++;
        continue;
      }
    } else {
      // スペース区切りモードでは非3桁コードをそのまま処理
      if(char === " ") {
        i++;
        continue;
      }
    }

    // 暗号コードの処理
    let code = "";
    if(delim === "space") {
      // スペース区切りモード
      let j = i;
      while(j < txt.length && txt[j] !== " ") {
        code += txt[j];
        j++;
      }
      i = j;
    } else {
      // 連結モード（3桁固定）
      if(i + 2 < txt.length) {
        code = txt.substr(i, 3);
        i += 3;
      } else {
        // 残りが3桁未満
        if(nonAlphaOpt === "keep") {
          result += txt.substr(i);
        }
        break;
      }
    }

    // マトリクスから復号
    if(code.length === 3 && /^[0-9]{3}$/.test(code)) {
      let found = false;
      const size = matrix.length;
      for(let r=0; r<size; r++){
        for(let c=0; c<size; c++){
          if(matrix[r][c] === code){
            result += currentAlphabet[r] + currentAlphabet[c];
            found = true;
            break;
          }
        }
        if(found) break;
      }
      if(!found) result += "??";
    } else if(code) {
      // 無効なコード（復号では単純にそのまま出力）
      result += code;
    }
  }

  // 冗字の削除
  let dummy = document.getElementById("decryptDummyChar").value.toUpperCase() || "X";
  if(result.endsWith(dummy)) result = result.slice(0,-1);

  document.getElementById("decryptOutputText").value = result;
}

// クリア（暗号化）
function clearEncryptText(){
  document.getElementById("encryptInputText").value="";
  document.getElementById("encryptOutputText").value="";
}

// クリア（復号）
function clearDecryptText(){
  document.getElementById("decryptInputText").value="";
  document.getElementById("decryptOutputText").value="";
}

// コピー（暗号化）
function copyEncryptOutput(){
  let text = document.getElementById("encryptOutputText");
  text.select();

  // モダンなクリップボードAPIを使用（フォールバック付き）
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text.value).then(() => {
      showToast("コピーしました");
    }).catch(() => {
      // フォールバック
      document.execCommand("copy");
      showToast("コピーしました");
    });
  } else {
    // 古いブラウザ向けフォールバック
    document.execCommand("copy");
    showToast("コピーしました");
  }
}

// コピー（復号）
function copyDecryptOutput(){
  let text = document.getElementById("decryptOutputText");
  text.select();

  // モダンなクリップボードAPIを使用（フォールバック付き）
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text.value).then(() => {
      showToast("コピーしました");
    }).catch(() => {
      // フォールバック
      document.execCommand("copy");
      showToast("コピーしました");
    });
  } else {
    // 古いブラウザ向けフォールバック
    document.execCommand("copy");
    showToast("コピーしました");
  }
}

// トースト通知を表示
function showToast(message) {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 新しいトーストを作成
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  // ボディに追加
  document.body.appendChild(toast);

  // アニメーション開始
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // 3秒後に非表示にして削除
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 通信シミュレーター
function simulateComm(){
  if(matrix.length === 0) {
    alert("置換表を生成してください");
    return;
  }

  const originalPlain = document.getElementById("commInput").value.trim();
  if(!originalPlain) {
    alert("送信したい平文を入力してください");
    return;
  }

  // === 送信側処理 ===

  // 1. 送信側：文字前処理
  let plainText = originalPlain.toUpperCase();
  let step1Text = `【送信側】元の平文: ${originalPlain}\n`;
  step1Text += `大文字変換: ${plainText}\n`;

  // 非アルファベット文字を除外
  let processed = plainText.replace(/[^A-Z]/g, "");
  if(plainText !== processed) {
    step1Text += `非アルファベット除外: ${processed}\n`;
  }

  // 20×20モードの場合、除外文字を削除
  if(currentAlphabet === alphabet20) {
    let beforeExclude = processed;
    processed = processed.replace(/[JKUWXZ]/g, "");
    if(beforeExclude !== processed) {
      step1Text += `除外文字(J,K,U,W,X,Z)削除: ${processed}\n`;
    }
  }

  // パディング処理
  const dummyChar = "X";
  if(processed.length % 2 === 1) {
    processed += dummyChar;
    step1Text += `冗字'${dummyChar}'追加: ${processed}\n`;
  }

  step1Text += `→ 暗号化対象文字列: ${processed}`;
  document.getElementById("commPlaintext").textContent = step1Text;

  // 2. 送信側：暗号化
  let cipherCodes = [];
  let step2Text = "【送信側】暗号化処理:\n\n";

  for(let i = 0; i < processed.length; i += 2) {
    let char1 = processed[i];
    let char2 = processed[i+1];
    let pair = char1 + char2;

    let row = currentAlphabet.indexOf(char1);
    let col = currentAlphabet.indexOf(char2);

    if(row >= 0 && col >= 0) {
      let code = matrix[row][col];
      cipherCodes.push(code);
      step2Text += `文字ペア '${pair}' → コード '${code}'\n`;
    } else {
      step2Text += `エラー: '${pair}' は変換できません\n`;
    }
  }

  let transmittedData = cipherCodes.join("");
  step2Text += `\n→ 送信データ（数字列）: ${transmittedData}`;
  document.getElementById("commCiphertext").textContent = step2Text;

  // === 受信側処理 ===

  // 3. 受信側：復号
  let step3Text = "【受信側】復号処理:\n\n";
  step3Text += `受信データ: ${transmittedData}\n`;
  step3Text += "3桁ずつ分離して復号:\n\n";

  let decryptedText = "";
  for(let i = 0; i < transmittedData.length; i += 3) {
    if(i + 2 < transmittedData.length) {
      let code = transmittedData.substr(i, 3);
      let foundPair = "";

      // 置換表から逆引き
      let found = false;
      for(let r = 0; r < matrix.length; r++) {
        for(let c = 0; c < matrix.length; c++) {
          if(matrix[r][c] === code) {
            foundPair = currentAlphabet[r] + currentAlphabet[c];
            decryptedText += foundPair;
            found = true;
            break;
          }
        }
        if(found) break;
      }

      if(found) {
        step3Text += `コード '${code}' → 文字ペア '${foundPair}'\n`;
      } else {
        step3Text += `コード '${code}' → 不明(??) \n`;
        decryptedText += "??";
      }
    }
  }

  step3Text += `\n復号結果: ${decryptedText}\n`;

  // 冗字削除
  let finalResult = decryptedText;
  if(decryptedText.endsWith(dummyChar)) {
    finalResult = decryptedText.slice(0, -1);
    step3Text += `冗字'${dummyChar}'削除: ${finalResult}\n`;
  }

  step3Text += `\n→ 最終受信結果: ${finalResult}`;
  document.getElementById("commDecrypted").textContent = step3Text;

  // 4. 通信結果判定
  const statusEl = document.getElementById("commStatus");
  let expectedResult = originalPlain.toUpperCase().replace(/[^A-Z]/g, "");
  if(currentAlphabet === alphabet20) {
    expectedResult = expectedResult.replace(/[JKUWXZ]/g, "");
  }

  // HTMLエスケープ関数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if(expectedResult === finalResult) {
    statusEl.innerHTML = "✅ <strong>通信成功</strong>：送信データと受信データが完全に一致しました";
    statusEl.className = "result-status success";
  } else {
    const escapedExpected = escapeHtml(expectedResult);
    const escapedActual = escapeHtml(finalResult);
    statusEl.innerHTML = `⚠️ <strong>通信結果</strong>：期待値「${escapedExpected}」→ 実際「${escapedActual}」`;
    statusEl.className = "result-status warning";
  }
}

// 通信シミュレーターのクリア機能
function clearCommInput(){
  document.getElementById("commInput").value = "";
  document.getElementById("commPlaintext").textContent = "";
  document.getElementById("commCiphertext").textContent = "";
  document.getElementById("commDecrypted").textContent = "";
  document.getElementById("commStatus").textContent = "";
}
