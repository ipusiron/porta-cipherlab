// 画面に出す文言（通常のスクリプト。globalThis.PortaMessages に置く）。{name} は値で埋める。
// 計算部（js/porta-core.js）と script.js は文言を持たず、ここのキーを引く。
(function (root) {
  'use strict';

  const ja = {
    // 鍵（表）
    'key.none': 'まだ表がありません。「表を作る」か「鍵を読み込む」を押してください。',
    'key.info': 'いまの鍵: {size}×{size}（{source}）／予約コード: {reserved}',
    'key.reservedNone': 'なし',
    'key.sourceSeed': 'シード「{seed}」から作成',
    'key.sourceRandom': '暗号用の乱数から作成',
    'key.sourceImport': '「{name}」から読み込み',
    'key.sizeMismatch': '選んでいる大きさ（{selected}×{selected}）と、いまの鍵（{size}×{size}）が違います。作り直すときは「表を作る」を押してください。',
    'status.generated': '{size}×{size}の表を作りました（{cells}マス、{source}）。',
    'status.imported': '鍵を読み込みました（{size}×{size}、{name}）。',
    'status.exported': '鍵を書き出しました（{name}）。',
    'matrix.empty': '表がまだありません。「表を作る」を押してください。',
    'matrix.caption': '上の見出し＝1文字目、左の見出し＝2文字目（原典と同じ引き方）。例: 「HE」はHの列とEの行が交わるマスです。',
    'matrix.cellLabel': '{first}{second} → {code}',
    'matrix.corner': '2＼1',
    'matrix.cornerTitle': '上の見出し＝1文字目、左の見出し＝2文字目',
    'list.sep': '、',
    'lookup.hint': '2文字を入れると、その組のマスを表の中で示します。',
    'lookup.result': '{first}（上の見出し）× {second}（左の見出し）→ {code}',
    'lookup.notInTable': '「{chars}」には、この表にない文字があります（表の文字: {alphabet}）。',
    'lookup.noKey': '先に表を作ってください。',

    // 計算部が返すエラー
    'error.noKey': 'まだ表がありません。「置換表」タブで表を作るか、鍵を読み込んでください。',
    'error.tooLong': '長すぎます（{length}文字）。{max}文字までにしてください。',
    'error.noLetters': '表で使える英字がありません。英字（A〜Z）を入れてください。',
    'error.dummyNotInTable': '冗字「{dummy}」は表にない文字です。表の文字（{alphabet}）から1文字を選んでください。',
    'error.noCodes': '暗号文（3桁の数）を入れてください。',
    'error.nonDigit': '{pos}文字目の「{char}」は数字ではありません。連結の形は数字だけを並べます。',
    'error.badLength': '数字が{length}桁あり、3桁ずつに区切ると{rest}桁余ります。抜けや余分な数字がないか確かめてください。',
    'error.looksConcat': '{index}番目の「{token}」は3桁ずつの連結に見えます。「区切り」を「連結（3桁ずつ）」にしてください。',
    'error.badToken': '{index}番目の「{token}」は3桁の数ではありません。',
    'error.badReserved': '予約コードは3桁の数で書いてください（読めなかったもの: {tokens}）。',
    'error.tooManyReserved': '予約コードが多すぎます（{count}個）。{max}個までにしてください。',
    'error.notEnoughCodes': '予約コードを除くと使える数が足りません（必要 {need}個、使える数 {available}個）。',
    'error.seedTooLong': 'シードが長すぎます（{length}文字）。{max}文字までにしてください。',
    'error.keyTooLarge': '鍵のファイルが大きすぎます（{max}バイトまで）。',
    'error.keyNotJson': '鍵のファイルをJSONとして読めませんでした。',
    'error.keyShape': 'このツールの鍵のファイルではありません。',
    'error.keyVersion': '対応していない版の鍵のファイルです。',
    'error.keySize': '表の大きさが20×20か26×26になっていません。',
    'error.keyAlphabet': '表の文字の並び（alphabet）が、20文字の表とも26文字の表とも違います。',
    'error.keyCell': '「{pair}」のマスが3桁の数になっていません。',
    'error.keyDuplicate': '同じ数（{code}）が2つのマスにあります。',
    'error.keyReserved': '予約コード（reserved）が3桁の数の並びになっていません。',
    'error.keyReservedClash': '予約コード {code} が表のマスにも使われています。',
    'error.fileRead': 'ファイルを読めませんでした。',

    // 警告
    'warn.endsWithDummy': '平文の英字は偶数個で、最後が冗字と同じ「{dummy}」です。受け取る側が「末尾の冗字を外す」で復号すると、この「{dummy}」も消えます。冗字を別の文字にするか、相手に伝えてください。',
    'warn.unknownCodes': 'この表にない数が{count}個あります（番号:数 = {list}）。「??」で示しました。鍵が違うか、写し間違いの可能性があります。',
    'warn.strippedDummy': '末尾の「{dummy}」を冗字として外しました。平文が「{dummy}」で終わるはずなら、「末尾の冗字を外す」を切ってください。',
    'warn.reservedCode': '（予約コード）',

    // 暗号化・復号の結果
    'enc.summary': '英字{letters}文字 → {pairs}組 → 3桁の数{pairs}個',
    'enc.padded': '英字が奇数個なので、最後に冗字「{dummy}」を足しました。',
    'enc.dropped': '暗号化から外した文字（{count}文字）: {list}',
    'enc.replaced': '置き換えた文字（{count}文字）: {list}',
    'enc.more': 'ほか{count}文字',
    'enc.pairsTitle': '組と数の対応',
    'item.dropped': '{pos}文字目「{char}」',
    'group.space': '空白{count}文字',
    'group.withList': '{reason}{count}文字（{list}）',
    'group.sep': '／',
    'item.replaced': '{pos}文字目 {char}→{to}',
    'reason.digit': '数字',
    'reason.symbol': '記号など',
    'reason.notInTable': '表にない英字',
    'dec.summary': '3桁の数{codes}個 → 英字{letters}文字',
    'dec.pairsTitle': '数と組の対応',

    // 通信シミュレーター
    'comm.step1': '【送信側】元の平文: {text}\n表で使う英字: {letters}',
    'comm.step1Replaced': '置き換えた文字: {list}',
    'comm.step1Dropped': '送らない文字（{count}文字）: {list}',
    'comm.step1Padded': '冗字「{dummy}」を足す: {letters}',
    'comm.step1Result': '→ 暗号化する英字: {letters}',
    'comm.step2Title': '【送信側】2文字ずつ3桁の数に置き換える:',
    'comm.step2Line': '{pair} → {code}',
    'comm.step2Result': '→ 送る数字の列: {data}',
    'comm.step3Title': '【受信側】受け取った数字の列: {data}\n3桁ずつ区切って表から引く:',
    'comm.step3Line': '{code} → {pair}',
    'comm.step3Stripped': '末尾の冗字「{dummy}」を外す: {letters}',
    'comm.step3Result': '→ 受け取った英字: {letters}',
    'comm.success': '✅ 通信成功: 受け取った英字が、送った英字と一致しました。',
    'comm.noteReplaced': '置き換えた文字が{count}文字あります（受け取る側には置き換えたあとの英字が届きます）。',
    'comm.noteLost': '送らなかった文字が{count}文字あります（1.の一覧を参照）。',
    'comm.mismatch': '⚠️ 一致しません: 送った英字「{expected}」、受け取った英字「{received}」。',
    'comm.noInput': '送りたい平文を入れてください。',

    // コピー・トースト
    'toast.copied': 'コピーしました',
    'toast.copyFailed': 'コピーできませんでした。出力欄を選んで手でコピーしてください。',
    'toast.nothingToCopy': 'コピーする内容がありません',

    // ヘルプの開閉
    'help.show': '説明を表示',
    'help.hide': '説明を閉じる',
  };

  const dict = { ja };
  let lang = 'ja';

  function t(key, params) {
    const table = dict[lang] || ja;
    let s = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : key;
    if (params) {
      s = s.replace(/\{(\w+)\}/g, (m, name) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m));
    }
    return s;
  }

  // 計算部が返す { key, params } を文に
  const tm = (m) => (m ? t(m.key, m.params) : '');

  root.PortaMessages = {
    dict,
    t,
    tm,
    getLanguage: () => lang,
    setLanguage(next) {
      if (dict[next]) lang = next;
      return lang;
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
