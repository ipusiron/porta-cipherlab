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
    'error.badSymbol': '記号の位置が表の範囲の外です。',

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

    // 原典の記号
    'sym.label': '{first}の列と{second}の行の記号',
    'sym.summary': '英字{letters}文字 → 記号{count}個',
    'sym.saved': 'PNGで保存しました（{name}）',
    'sym.saveFailed': 'PNGで保存できませんでした。ファイルとして開いたページ（file://）では、ブラウザーによって画像の書き出しが止められます（ChromeやEdgeなど）。'
      + 'HTTPで配信したページか公開ページで試してください。',
    'sym.pickerCaption': '原典の表（上の見出し＝1文字目、右の見出し＝2文字目）',
    'sym.decoded': '選んだ記号{count}個 → {letters}',
    'sym.decodedEmpty': '表の記号を押すと、ここに英字が出ます。',

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

    // 画面の固定の文言（index.html の data-i18n・data-i18n-attr）
    'ui.docTitle': 'Porta CipherLab - ポルタの二文字式暗号ツール',
    'ui.langButton': 'English',
    'ui.title': 'Porta CipherLab - ポルタの二文字式暗号ツール',
    'ui.subtitle': '平文を2文字ずつ区切り、表の1マス（3桁の数）に置き換える1563年の暗号を体験できる教育用ツール',
    'ui.tabKeygen': '置換表',
    'ui.tabEncrypt': '暗号化',
    'ui.tabDecrypt': '復号',
    'ui.tabSymbols': '原典の記号',
    'ui.tabComm': '通信シミュレーター',
    'ui.tabDocs': '座学',
    'ui.keygenTitle': '置換表（鍵）を作る',
    'ui.sizeLabel': '表の大きさ',
    'ui.size26': '26×26（A〜Zのすべて）',
    'ui.size20': '20×20（原典の20文字。J・K・U・W・X・Yなし）',
    'ui.helpSize': '原典（1563年）の表はA B C D E F G H I L M N O P Q R S T V Zの20文字で、20×20＝400マスです。26×26はすべての英字を使える拡張版です。',
    'ui.seedLabel': 'シード',
    'ui.helpSeed': '同じシードを入れると同じ表を作り直せます（擬似乱数で作るので、表の推測しにくさはシードの推測しにくさで決まります）。空欄にすると暗号用の乱数（crypto.getRandomValues）で作ります。',
    'ui.reservedLabel': '予約コード',
    'ui.helpReserved': '表のマスに使わない3桁の数です（カンマか空白で区切る）。通信の合図などに取っておく使い方を想定しています。',
    'ui.generate': '表を作る',
    'ui.import': '鍵を読み込む',
    'ui.export': '鍵を書き出す',
    'ui.lookupTitle': '表で引いてみる',
    'ui.lookupLabel': '2文字',
    'ui.matrixTitle': '置換表',
    'ui.encryptTitle': '暗号化',
    'ui.plaintext': '平文',
    'ui.clear': 'クリア',
    'ui.dummyLabel': '冗字',
    'ui.helpDummy': '英字が奇数個のとき、最後の組を作るために足す文字です。表にある文字から選びます（既定: 26×26はX、20×20はZ）。',
    'ui.delimiterLabel': '区切り',
    'ui.delimSpace': '空白で区切る',
    'ui.delimConcat': '連結（3桁ずつ）',
    'ui.excludedLabel': '表にない英字',
    'ui.handleReplace': '置き換える（J→I・U→V・W→VV）',
    'ui.handleDrop': '外す',
    'ui.helpExcluded': '20×20の表だけで使います。当時はIとJ、UとVを同じ文字として扱っていたので置き換えます。K・X・Yは表にないので外します。英字以外（空白・記号・数字）は暗号化から外し、下に一覧で示します。',
    'ui.encryptButton': '暗号化',
    'ui.ciphertext': '暗号文',
    'ui.copy': 'コピー',
    'ui.decryptTitle': '復号',
    'ui.ciphertextCodes': '暗号文（3桁の数）',
    'ui.stripDummy': '末尾の冗字を外す',
    'ui.decryptButton': '復号',
    'ui.plaintextLetters': '平文（英字）',
    'ui.symTitle': '原典の記号で暗号化・復号',
    'ui.symIntro1': '1563年初版p.90の表（リヨン市立図書館所蔵本のスキャン、Public Domain Mark 1.0）から切り出した400個の記号を使います。',
    'ui.symIntro2': '表は原典の20文字（J・K・U・W・X・Yなし）に固定で、上の見出しが1文字目、右の見出しが2文字目です。',
    'ui.symEncTitle': '平文を記号にする',
    'ui.symShowPairs': '記号の下に組の文字を出す',
    'ui.symEncrypt': '記号にする',
    'ui.symExample': 'ポルタの例文を入れる',
    'ui.symSave': 'PNGで保存',
    'ui.symPickTitle': '記号を選んで読む',
    'ui.symPickIntro': '原典と同じ並びの表です。暗号文の記号と同じものを順に押すと、英字に戻します。原典は、探しやすいように似た記号を同じ列に集めています。表の中は矢印キーでも動けます。',
    'ui.symUndo': '1つ戻す',
    'ui.symReset': '選んだ記号を消す',
    'ui.symReadTitle': '原典の暗号文を読んでみる',
    'ui.symExampleCaption': '1563年初版p.91に刷られたポルタの例文の暗号文（記号60個、5行）。リヨン市立図書館所蔵本のスキャン（Public Domain Mark 1.0）。',
    'ui.symReadIntro': '上の表から記号を順に選ぶと読めます。最初の記号は、Mの列とVの行が交わるマスにあります。',
    'ui.symAnswerSummary': '答え: このツールで同じ例文を記号にした列',
    'ui.symAnswerNote': '刷られた暗号文と1つずつ見比べると、60個すべてが同じ順に並びます。逆に引いた表（1文字目を横の見出し）では、最初の記号から食い違います。',
    'ui.commTitle': '通信シミュレーター',
    'ui.commHowTitle': '💡 使い方',
    'ui.commHow1a': '平文（ふつうの文章）',
    'ui.commHow1b': 'を入れてください。暗号文ではありません。',
    'ui.commHow2a': '「送信＆受信」を押すと、いまの表で',
    'ui.commHow2b': '送る側の暗号化 → 数字の列の送信 → 受ける側の復号',
    'ui.commHow2c': 'を通しで行います。冗字は表の既定（26×26はX、20×20はZ）、20×20の表にない英字は置き換えます。',
    'ui.commInputLabel': '送りたい平文',
    'ui.simulate': '送信＆受信',
    'ui.commResultTitle': '通信結果',
    'ui.commStep1': '1. 送る平文',
    'ui.commStep2': '2. 暗号化して送るデータ',
    'ui.commStep3': '3. 受け取って復号したデータ',
    'ui.docsTitle': 'ポルタの二文字式暗号',
    'ui.docsIntro': 'ナポリの学者ジョヴァンニ・バッティスタ・デッラ・ポルタ（Giovanni Battista della Porta、1535年ごろ〜1615年）は、1563年に刊行した暗号書『De Furtivis '
      + 'Literarum Notis』の第2巻第13章で、平文の2文字を記号1つに置き換える表を示しました。',
    'ui.docsTableCaption': '原典の表（20×20＝400マス、1563年初版p.90）。上の見出しが1文字目、右の見出しが2文字目です。リヨン市立図書館所蔵本のスキャン（Public Domain Mark 1.0）。',
    'ui.docsRuleTitle': '表の作り方と引き方',
    'ui.docsRule1': '原典は、正方形の両辺を20等分して400のマスを作り、各マスに記号を1つずつ入れ、上辺と側面にアルファベットを並べると書いています。引き方は「1文字目の下にあり、'
      + '2文字目と横から出会うマスの記号を取る」です。つまり上の見出しが1文字目、横の見出しが2文字目です。相手に知らせておけば逆に引いてもよい、とも書いています。',
    'ui.docsRule2': '受け取った側は、曲尺（L字の定規）の角を記号に当てて上と横の文字を読みます。原典は、探しやすいように似た記号を同じ並びに置いたと述べています。',
    'ui.docsKahn': '暗号史家のデイヴィッド・カーン（David Kahn）は『The Codebreakers』で、これを暗号学で最初の二文字式暗号と書いています。文字どうしを置き換える二文字式としては、'
      + '19世紀のプレイフェア暗号が最初です。',
    'ui.docsThisTool': '本ツールの表も原典と同じ向きで、上の見出しが1文字目、左の見出しが2文字目です。記号の代わりに、各マスへ重複のない3桁の数を入れます。',
    'ui.docsSymbols': '「原典の記号」タブでは、この表から切り出した記号そのもので暗号化できます。p.91に刷られたポルタの例文の暗号文も、この表で読むと例文に戻ります。',
    'ui.docsAlphaTitle': '20文字のアルファベット',
    'ui.docsAlpha': '原典の表の文字はA B C D E F G H I L M N O P Q R S T V Zの20文字で、J・K・U・W・X・Yはありません。原典の例文もUをVで書いています（VNIVERSA、'
      + 'CIVITAS）。本ツールの20×20の表では、J→I、U→V、W→VVに置き換え、K・X・Yは外して一覧に示します（「外す」を選ぶとJ・U・Wも外します）。',
    'ui.docsExampleTitle': 'ポルタ自身の例文',
    'ui.docsExampleTranslation': '試訳: 双方で多くの損害を与え、また受けたのち、町はほぼ全体が占領された。残りは書かず、会ったときのために取っておく。',
    'ui.docsExampleCount': '英字は120個（60組）で、すべて20文字の表にあります。',
    'ui.useExample': 'この例文を暗号化タブに入れる',
    'ui.docsRareTitle': '同じ記号は本当に「まれ」か',
    'ui.docsRare': '原典は、2文字を1つの記号にするので、同じ記号が文中に2度出ることはまれだと述べています。しかし例文の120字の中でも、ISの組は3回、QV・ED・AT・ER・ST・REは2回ずつ出ます。'
      + '英語の小説（ディケンズ『二都物語』）から切り出して数えると、次のとおりです。',
    'ui.docsRareCaption': '2文字ずつ区切ったとき、2回以上出る組が占める割合（200か所の平均）',
    'ui.docsRareColLetters': '英字の数',
    'ui.docsRareColPairs': '組の数',
    'ui.docsRareColShare': '2回以上出る組の割合',
    'ui.docsRareColTop': '最多の組の回数',
    'ui.docsRareAfter': '英語ではTH・HE・ERなどの組が多く出ます。この偏りは、二文字式の暗号を解く手がかりになります（二文字の頻度分析）。「通信シミュレーター」で長めの文を送ると、同じ数が何度も出るのを確かめられます。',
    'ui.docsKeyTitle': '本ツールの表（鍵）と乱数',
    'ui.docsKey1': 'シードを入れたときは擬似乱数（cyrb128＋sfc32）で表を作る。同じシードから同じ表を作り直せるが、表の推測しにくさはシードの推測しにくさで決まる',
    'ui.docsKey2': 'シードが空欄のときは暗号用の乱数（crypto.getRandomValues）で作る。20×20の表の並べ方は約2の3850乗通りある',
    'ui.docsKey3': '鍵はJSONで書き出し・読み込みできる（matrix[1文字目][2文字目]の形）',
    'ui.docsRelatedTitle': '関連ツール',
    'ui.relPlayfair': '（Day027）: 5×5の表から規則で2文字を2文字に換える二文字式の暗号',
    'ui.relHill': '（Day093）: 行列の計算で複数の文字をまとめて換える暗号',
    'ui.relPolybius': '（Day067）: 1文字を2つの数字に換える方陣',
    'ui.relStructure': '（Day097）: 換字と転置の構造を学ぶ',
    'ui.docsSourcesTitle': '出典',
    'ui.secTitle': '⚠️ セキュリティの注意',
    'ui.secLeadA': '本ツールは',
    'ui.secLeadB': '教育目的',
    'ui.secLeadC': 'のツールです。次の点に注意してください。',
    'ui.sec1': 'ポルタの二文字式暗号は古典暗号で、現代の安全性の基準を満たしません',
    'ui.sec2': '重要な情報の暗号化には使わないでください',
    'ui.sec3': '暗号化・復号・表の生成はブラウザーの中だけで行い、外部へは送信しません',
    'ui.footerLead': '🔗 GitHubリポジトリー:',
    'ui.langLabel': '英語に切り替える',
    'ui.tabsLabel': '機能',
    'ui.seedPlaceholder': '空欄なら暗号用の乱数で作る',
    'ui.reservedPlaceholder': '例: 000,999',
    'ui.lookupPlaceholder': '例: HE',
    'ui.encryptPlaceholder': '平文を入力（例: Hello world.）',
    'ui.decryptPlaceholder': '暗号文を入力（例: 583 950 564 161 096）',
    'ui.symPlaceholder': '平文を入力（例: Attack at dawn）',
    'ui.symExampleAlt': 'ポルタの例文の暗号文。飾り枠の中に記号が5行に並んでいる',
    'ui.commPlaceholder': '例: Attack at dawn!',
    'ui.docsTableAlt': 'ポルタの二文字式暗号の表。上と右に20文字のアルファベットが並び、400のマスに記号が1つずつ入っている',
  };

  const en = {
    // 鍵（表）
    'key.none': 'No table yet. Press “Create table” or “Load key”.',
    'key.info': 'Current key: {size}×{size} ({source}) / Reserved codes: {reserved}',
    'key.reservedNone': 'none',
    'key.sourceSeed': 'created from the seed “{seed}”',
    'key.sourceRandom': 'created from cryptographic randomness',
    'key.sourceImport': 'loaded from “{name}”',
    'key.sizeMismatch': 'The selected size ({selected}×{selected}) differs from the current key ({size}×{size}). Press '
      + '“Create table” to rebuild it.',
    'status.generated': 'Created a {size}×{size} table ({cells} cells, {source}).',
    'status.imported': 'Loaded the key ({size}×{size}, {name}).',
    'status.exported': 'Saved the key ({name}).',
    'matrix.empty': 'No table yet. Press “Create table”.',
    'matrix.caption': 'Top heading = first letter, left heading = second letter (the same reading as the original). '
      + 'Example: “HE” is the cell where column H meets row E.',
    'matrix.cellLabel': '{first}{second} → {code}',
    'matrix.corner': '2\\1',
    'matrix.cornerTitle': 'Top heading = first letter, left heading = second letter',
    'list.sep': ', ',
    'lookup.hint': 'Enter two letters to highlight their cell in the table.',
    'lookup.result': '{first} (top heading) × {second} (left heading) → {code}',
    'lookup.notInTable': '“{chars}” contains a letter that is not in this table (table letters: {alphabet}).',
    'lookup.noKey': 'Create a table first.',

    // 計算部が返すエラー
    'error.noKey': 'No table yet. Create one in the “Table” tab or load a key.',
    'error.tooLong': 'Too long ({length} characters). The limit is {max}.',
    'error.noLetters': 'There are no letters the table can use. Enter letters (A–Z).',
    'error.dummyNotInTable': 'The padding letter “{dummy}” is not in the table. Choose one letter from the table ({alphabet}).',
    'error.noCodes': 'Enter the ciphertext (3-digit numbers).',
    'error.nonDigit': 'Character {pos}, “{char}”, is not a digit. The joined form contains digits only.',
    'error.badLength': 'There are {length} digits; splitting them into groups of 3 leaves {rest}. Check for missing or '
      + 'extra digits.',
    'error.looksConcat': 'Item {index}, “{token}”, looks like joined 3-digit codes. Set “Separator” to “Joined (3 digits '
      + 'each)”.',
    'error.badToken': 'Item {index}, “{token}”, is not a 3-digit number.',
    'error.badReserved': 'Write reserved codes as 3-digit numbers (could not read: {tokens}).',
    'error.tooManyReserved': 'Too many reserved codes ({count}). The limit is {max}.',
    'error.notEnoughCodes': 'Not enough numbers are left after the reserved codes (needed {need}, available {available}).',
    'error.seedTooLong': 'The seed is too long ({length} characters). The limit is {max}.',
    'error.keyTooLarge': 'The key file is too large (limit {max} bytes).',
    'error.keyNotJson': 'The key file could not be read as JSON.',
    'error.keyShape': 'This is not a key file for this tool.',
    'error.keyVersion': 'This key file version is not supported.',
    'error.keySize': 'The table is not 20×20 or 26×26.',
    'error.keyAlphabet': 'The table alphabet matches neither the 20-letter nor the 26-letter table.',
    'error.keyCell': 'The cell “{pair}” does not hold a 3-digit number.',
    'error.keyDuplicate': 'The same number ({code}) is in two cells.',
    'error.keyReserved': 'The reserved codes are not a list of 3-digit numbers.',
    'error.keyReservedClash': 'The reserved code {code} is also used in a table cell.',
    'error.fileRead': 'The file could not be read.',
    'error.badSymbol': 'The symbol position is outside the table.',

    // 警告
    'warn.endsWithDummy': 'The plaintext has an even number of letters and ends with “{dummy}”, the padding letter. If the '
      + 'receiver decrypts with “Remove the trailing padding letter”, this “{dummy}” will also disappear. '
      + 'Choose another padding letter or tell the receiver.',
    'warn.unknownCodes': 'Numbers not in this table: {count} (position:number = {list}); shown as “??”. The key may be '
      + 'different or the numbers may be miscopied.',
    'warn.strippedDummy': 'The trailing “{dummy}” was removed as padding. If the plaintext should end with “{dummy}”, turn off '
      + '“Remove the trailing padding letter”.',
    'warn.reservedCode': '(reserved code)',

    // 暗号化・復号の結果
    'enc.summary': 'Letters: {letters} → pairs: {pairs} → 3-digit numbers: {pairs}',
    'enc.padded': 'The number of letters is odd, so the padding letter “{dummy}” was added at the end.',
    'enc.dropped': 'Characters left out of the encryption ({count}): {list}',
    'enc.replaced': 'Replaced letters ({count}): {list}',
    'enc.more': 'and {count} more',
    'enc.pairsTitle': 'Pairs and numbers',
    'item.dropped': '#{pos} “{char}”',
    'group.space': 'spaces: {count}',
    'group.withList': '{reason}: {count} ({list})',
    'group.sep': ' / ',
    'item.replaced': '#{pos} {char}→{to}',
    'reason.digit': 'digits',
    'reason.symbol': 'symbols etc.',
    'reason.notInTable': 'letters not in the table',
    'dec.summary': '3-digit numbers: {codes} → letters: {letters}',
    'dec.pairsTitle': 'Numbers and pairs',

    // 原典の記号
    'sym.label': 'symbol at column {first}, row {second}',
    'sym.summary': 'Letters: {letters} → symbols: {count}',
    'sym.saved': 'Saved as PNG ({name})',
    'sym.saveFailed': 'Could not save the PNG. When the page is opened as a file (file://), some browsers (such as Chrome '
      + 'and Edge) block exporting the image. Try the page served over HTTP or the published page.',
    'sym.pickerCaption': 'The original table (top heading = first letter, right heading = second letter)',
    'sym.decoded': 'Symbols picked: {count} → {letters}',
    'sym.decodedEmpty': 'Press symbols in the table and the letters appear here.',

    // 通信シミュレーター
    'comm.step1': '[Sender] Original plaintext: {text}\nLetters used by the table: {letters}',
    'comm.step1Replaced': 'Replaced letters: {list}',
    'comm.step1Dropped': 'Characters not sent ({count}): {list}',
    'comm.step1Padded': 'Add the padding letter “{dummy}”: {letters}',
    'comm.step1Result': '→ Letters to encrypt: {letters}',
    'comm.step2Title': '[Sender] Replace each pair with a 3-digit number:',
    'comm.step2Line': '{pair} → {code}',
    'comm.step2Result': '→ Digits sent: {data}',
    'comm.step3Title': '[Receiver] Digits received: {data}\nSplit into groups of 3 and look them up in the table:',
    'comm.step3Line': '{code} → {pair}',
    'comm.step3Stripped': 'Remove the trailing padding letter “{dummy}”: {letters}',
    'comm.step3Result': '→ Letters received: {letters}',
    'comm.success': '✅ Success: the letters received match the letters sent.',
    'comm.noteReplaced': ' Replaced letters: {count} (the receiver gets the replaced letters).',
    'comm.noteLost': ' Characters not sent: {count} (see the list in step 1).',
    'comm.mismatch': '⚠️ Mismatch: sent “{expected}”, received “{received}”.',
    'comm.noInput': 'Enter the plaintext to send.',

    // コピー・トースト
    'toast.copied': 'Copied',
    'toast.copyFailed': 'Could not copy. Select the output and copy it by hand.',
    'toast.nothingToCopy': 'Nothing to copy',

    // ヘルプの開閉
    'help.show': 'Show help',
    'help.hide': 'Hide help',

    // 画面の固定の文言（index.html の data-i18n・data-i18n-attr）
    'ui.docTitle': 'Porta CipherLab - Porta\'s Digraphic Cipher Tool',
    'ui.langButton': '日本語',
    'ui.title': 'Porta CipherLab - Porta\'s Digraphic Cipher Tool',
    'ui.subtitle': 'An educational tool for the 1563 cipher that splits plaintext into pairs of letters and replaces '
      + 'each pair with one cell of a table (a 3-digit number)',
    'ui.tabKeygen': 'Table',
    'ui.tabEncrypt': 'Encrypt',
    'ui.tabDecrypt': 'Decrypt',
    'ui.tabSymbols': 'Original symbols',
    'ui.tabComm': 'Transmission simulator',
    'ui.tabDocs': 'Background',
    'ui.keygenTitle': 'Create the substitution table (key)',
    'ui.sizeLabel': 'Table size',
    'ui.size26': '26×26 (all letters A–Z)',
    'ui.size20': '20×20 (the original 20 letters; no J, K, U, W, X, Y)',
    'ui.helpSize': 'The original table (1563) uses the 20 letters A B C D E F G H I L M N O P Q R S T V Z, giving 20×20 '
      + '= 400 cells. The 26×26 table is an extension that accepts every letter.',
    'ui.seedLabel': 'Seed',
    'ui.helpSeed': 'The same seed always rebuilds the same table (it uses a pseudorandom generator, so the table is '
      + 'only as hard to guess as the seed). Leave it empty to use cryptographic randomness '
      + '(crypto.getRandomValues).',
    'ui.reservedLabel': 'Reserved codes',
    'ui.helpReserved': 'Three-digit numbers that are never placed in the table (separate them with commas or spaces). They '
      + 'can be kept for signals such as control codes.',
    'ui.generate': 'Create table',
    'ui.import': 'Load key',
    'ui.export': 'Save key',
    'ui.lookupTitle': 'Look up a pair',
    'ui.lookupLabel': 'Two letters',
    'ui.matrixTitle': 'Substitution table',
    'ui.encryptTitle': 'Encrypt',
    'ui.plaintext': 'Plaintext',
    'ui.clear': 'Clear',
    'ui.dummyLabel': 'Padding letter',
    'ui.helpDummy': 'When the number of letters is odd, this letter is added to complete the last pair. Choose a letter '
      + 'that is in the table (default: X for 26×26, Z for 20×20).',
    'ui.delimiterLabel': 'Separator',
    'ui.delimSpace': 'Spaces between codes',
    'ui.delimConcat': 'Joined (3 digits each)',
    'ui.excludedLabel': 'Letters not in the table',
    'ui.handleReplace': 'Replace (J→I, U→V, W→VV)',
    'ui.handleDrop': 'Remove',
    'ui.helpExcluded': 'Used only with the 20×20 table. In Porta\'s time I and J, and U and V, were treated as the same '
      + 'letter, so they are replaced. K, X and Y are not in the table and are removed. Anything that is not '
      + 'a letter (spaces, symbols, digits) is left out of the encryption and listed below.',
    'ui.encryptButton': 'Encrypt',
    'ui.ciphertext': 'Ciphertext',
    'ui.copy': 'Copy',
    'ui.decryptTitle': 'Decrypt',
    'ui.ciphertextCodes': 'Ciphertext (3-digit numbers)',
    'ui.stripDummy': 'Remove the trailing padding letter',
    'ui.decryptButton': 'Decrypt',
    'ui.plaintextLetters': 'Plaintext (letters)',
    'ui.symTitle': 'Encrypt and decrypt with the original symbols',
    'ui.symIntro1': 'This tab uses the 400 symbols cut out of the table on p. 90 of the 1563 first edition (scan of the '
      + 'copy in the Lyon Public Library, Public Domain Mark 1.0).',
    'ui.symIntro2': 'The table is fixed to the original 20 letters (no J, K, U, W, X, Y). The top heading gives the '
      + 'first letter and the right-hand heading the second.',
    'ui.symEncTitle': 'Turn plaintext into symbols',
    'ui.symShowPairs': 'Show the letter pair under each symbol',
    'ui.symEncrypt': 'Convert to symbols',
    'ui.symExample': 'Insert Porta\'s example',
    'ui.symSave': 'Save as PNG',
    'ui.symPickTitle': 'Read by picking symbols',
    'ui.symPickIntro': 'This table has the same layout as the original. Press the symbols of a ciphertext in order to turn '
      + 'them back into letters. Porta grouped similar symbols in the same column so that they are easy to '
      + 'find. You can also move around the table with the arrow keys.',
    'ui.symUndo': 'Undo one',
    'ui.symReset': 'Clear picked symbols',
    'ui.symReadTitle': 'Read the original ciphertext',
    'ui.symExampleCaption': 'Ciphertext of Porta\'s example as printed on p. 91 of the 1563 first edition (60 symbols in 5 '
      + 'lines). Scan of the copy in the Lyon Public Library (Public Domain Mark 1.0).',
    'ui.symReadIntro': 'Pick the symbols in order from the table above to read it. The first symbol is in the cell where '
      + 'column M meets row V.',
    'ui.symAnswerSummary': 'Answer: the same example converted to symbols by this tool',
    'ui.symAnswerNote': 'Compared one by one with the printed ciphertext, all 60 symbols appear in the same order. With the '
      + 'reversed reading (first letter on the side heading), they differ from the very first symbol.',
    'ui.commTitle': 'Transmission simulator',
    'ui.commHowTitle': '💡 How to use',
    'ui.commHow1a': 'Enter plaintext (ordinary text)',
    'ui.commHow1b': ', not ciphertext.',
    'ui.commHow2a': 'Press “Send & receive” to run, with the current table, ',
    'ui.commHow2b': 'the sender\'s encryption → transmission of the digits → the receiver\'s decryption',
    'ui.commHow2c': ' in one go. The padding letter is the table\'s default (X for 26×26, Z for 20×20), and letters not '
      + 'in the 20×20 table are replaced.',
    'ui.commInputLabel': 'Plaintext to send',
    'ui.simulate': 'Send & receive',
    'ui.commResultTitle': 'Result',
    'ui.commStep1': '1. Plaintext to send',
    'ui.commStep2': '2. Data encrypted and sent',
    'ui.commStep3': '3. Data received and decrypted',
    'ui.docsTitle': 'Porta\'s digraphic cipher',
    'ui.docsIntro': 'Giovanni Battista della Porta (c. 1535–1615), a scholar of Naples, presented a table that replaces '
      + 'two plaintext letters with a single symbol in Book II, Chapter 13 of his cipher book De Furtivis '
      + 'Literarum Notis (1563).',
    'ui.docsTableCaption': 'The original table (20×20 = 400 cells, p. 90 of the 1563 first edition). The top heading gives the '
      + 'first letter and the right-hand heading the second. Scan of the copy in the Lyon Public Library '
      + '(Public Domain Mark 1.0).',
    'ui.docsRuleTitle': 'How the table is made and read',
    'ui.docsRule1': 'Porta divides each side of a square into 20 parts to make 400 cells, puts one symbol in each cell, '
      + 'and writes an alphabet along the top and down the side. To encipher, take the symbol that lies '
      + 'under the first letter and meets the second letter from the side. In other words, the top heading '
      + 'gives the first letter and the side heading the second. He adds that the reverse reading may be '
      + 'used if the correspondent is told in advance.',
    'ui.docsRule2': 'The receiver places the corner of a set square on a symbol to read the letters above and beside it. '
      + 'Porta says he placed similar symbols in the same order so that they are easy to find.',
    'ui.docsKahn': 'The cryptologic historian David Kahn describes this, in The Codebreakers, as the first digraphic '
      + 'cipher in cryptology. The first digraphic cipher that replaces letters with letters is the '
      + '19th-century Playfair cipher.',
    'ui.docsThisTool': 'This tool reads its table the same way: the top heading gives the first letter and the left heading '
      + 'the second. Instead of symbols, each cell holds a unique 3-digit number.',
    'ui.docsSymbols': 'The “Original symbols” tab encrypts with the symbols cut out of this very table. Reading the '
      + 'ciphertext of Porta\'s example printed on p. 91 with this table gives back the example.',
    'ui.docsAlphaTitle': 'The 20-letter alphabet',
    'ui.docsAlpha': 'The original table uses the 20 letters A B C D E F G H I L M N O P Q R S T V Z; there is no J, K, '
      + 'U, W, X or Y. Porta\'s example also writes U as V (VNIVERSA, CIVITAS). With the 20×20 table, this '
      + 'tool replaces J→I, U→V and W→VV, and removes K, X and Y, listing them (choosing “Remove” also '
      + 'removes J, U and W).',
    'ui.docsExampleTitle': 'Porta\'s own example',
    'ui.docsExampleTranslation': 'Translation: After many defeats given and received on both sides, almost the whole city has been '
      + 'occupied. The rest I will not write, but will keep for our meeting.',
    'ui.docsExampleCount': 'It has 120 letters (60 pairs), all of them in the 20-letter table.',
    'ui.useExample': 'Insert this example in the Encrypt tab',
    'ui.docsRareTitle': 'Is the same symbol really “rare”?',
    'ui.docsRare': 'Porta says that, because two letters become one symbol, the same symbol rarely appears twice in a '
      + 'text. Yet even in the 120 letters of his example, the pair IS appears three times and QV, ED, AT, '
      + 'ER, ST and RE twice each. Counting passages taken from an English novel (Dickens, A Tale of Two '
      + 'Cities) gives the following.',
    'ui.docsRareCaption': 'Share of pairs that appear twice or more when the text is split into pairs (average over 200 '
      + 'passages)',
    'ui.docsRareColLetters': 'Letters',
    'ui.docsRareColPairs': 'Pairs',
    'ui.docsRareColShare': 'Pairs appearing twice or more',
    'ui.docsRareColTop': 'Count of the most frequent pair',
    'ui.docsRareAfter': 'In English, pairs such as TH, HE and ER are common. This bias is a foothold for breaking digraphic '
      + 'ciphers (digraph frequency analysis). Send a longer text in the “Transmission simulator” to see the '
      + 'same number appear again and again.',
    'ui.docsKeyTitle': 'The table (key) and randomness in this tool',
    'ui.docsKey1': 'With a seed, the table is built from a pseudorandom generator (cyrb128 + sfc32). The same seed '
      + 'rebuilds the same table, but the table is only as hard to guess as the seed',
    'ui.docsKey2': 'With an empty seed, the table is built from cryptographic randomness (crypto.getRandomValues). A '
      + '20×20 table can be arranged in about 2^3850 ways',
    'ui.docsKey3': 'Keys can be saved and loaded as JSON (in the form matrix[first letter][second letter])',
    'ui.docsRelatedTitle': 'Related tools',
    'ui.relPlayfair': ' (Day027): a digraphic cipher that turns two letters into two letters by rules on a 5×5 square',
    'ui.relHill': ' (Day093): a cipher that transforms several letters at once with matrix arithmetic',
    'ui.relPolybius': ' (Day067): a square that turns one letter into two digits',
    'ui.relStructure': ' (Day097): learn the structures of substitution and transposition',
    'ui.docsSourcesTitle': 'Sources',
    'ui.secTitle': '⚠️ Security notes',
    'ui.secLeadA': 'This tool is for ',
    'ui.secLeadB': 'educational purposes',
    'ui.secLeadC': '. Please note the following.',
    'ui.sec1': 'Porta\'s digraphic cipher is a classical cipher and does not meet modern security standards',
    'ui.sec2': 'Do not use it to encrypt important information',
    'ui.sec3': 'Encryption, decryption and table generation run only in your browser; nothing is sent anywhere',
    'ui.footerLead': '🔗 GitHub repository:',
    'ui.langLabel': 'Switch to Japanese',
    'ui.tabsLabel': 'Features',
    'ui.seedPlaceholder': 'Leave empty for cryptographic randomness',
    'ui.reservedPlaceholder': 'e.g. 000,999',
    'ui.lookupPlaceholder': 'e.g. HE',
    'ui.encryptPlaceholder': 'Enter plaintext (e.g. Hello world.)',
    'ui.decryptPlaceholder': 'Enter ciphertext (e.g. 583 950 564 161 096)',
    'ui.symPlaceholder': 'Enter plaintext (e.g. Attack at dawn)',
    'ui.symExampleAlt': 'Ciphertext of Porta\'s example: symbols in five lines inside a decorative frame',
    'ui.commPlaceholder': 'e.g. Attack at dawn!',
    'ui.docsTableAlt': 'Porta\'s digraphic table. Twenty letters run along the top and the right side, and each of the 400 '
      + 'cells holds one symbol',
  };

  const dict = { ja, en };
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
