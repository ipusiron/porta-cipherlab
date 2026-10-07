# セキュリティレビュー結果

レビュー日: 2026-10-07
対象: Porta CipherLab（GitHub Pagesで公開する静的なWebツール）

## 総合評価

GitHub Pagesでの公開に支障のある問題はありません。
画面はブラウザーの中だけで動き、外部へ何も送信せず、外部のスクリプト・スタイル・画像も読みません。

## 実装している対策

| 項目 | 内容 | 確かめ方 |
|---|---|---|
| CSP | `default-src 'self'`、`script-src 'self'`、`style-src 'self'`、`img-src 'self' data:`、`connect-src 'none'`、`object-src 'none'`、`base-uri 'none'`、`form-action 'none'`。`'unsafe-inline'`・`'unsafe-eval'`は使わない | `test/html.test.js`、Chromium・Edge・Firefoxで違反0件 |
| インラインの処理 | `on〜=`のイベントハンドラー・style属性・インラインのスクリプトを使わない。処理は`addEventListener`で登録する | `test/html.test.js` |
| 表示 | 画面への表示は`textContent`と`createElement`だけで行い、`innerHTML`を使わない | `test/html.test.js` |
| 鍵のファイルの読み込み | JSONとして読めること、表が20×20か26×26であること、文字の並び、全マスが3桁の数で重複がないこと、予約コードが3桁の数でマスと衝突しないこと、200,000バイト以下であることを確かめてから使う | `test/core.test.js`（HTMLを入れたマスを拒否する） |
| 乱数 | シードが空欄なら`crypto.getRandomValues`と棄却法で表を作る | `test/core.test.js` |
| リファラー | `<meta name="referrer" content="no-referrer">` | `test/html.test.js` |
| 保存 | 入力・鍵をブラウザーに保存しない。localStorageに保存するのは表示の言語の選択（`porta-cipherlab-lang`）だけで、使えない環境でも動く | ソースの確認 |

## 残るリスクと注意

- シードから作る表は擬似乱数（cyrb128＋sfc32）で、推測しにくさはシードの推測しにくさで決まる。画面の説明とREADMEに書いている
- ポルタの二文字式暗号は古典暗号で、二文字の頻度分析や既知の平文で解ける。教育用と明記している
- CSPはmetaで指定しているため、`frame-ancestors`（埋め込みの禁止）は効かない。GitHub Pagesではレスポンスヘッダーを設定できない
- Safari・スマートフォンの実機では確かめていない
