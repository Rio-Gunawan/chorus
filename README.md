# 合唱曲「なんでもないや」再生用Webページ

わざわざこのページにお越しいただきありがとうございます。このサイトはGitHubといい、語弊を恐れずに言えば自分の書いたコードを公開できるサイトです。上にあるリストから、好きなファイルを選択すれば開くことができます。

こちらも読みやすいファイルになるよう心がけましたが、いつの間にか複雑なプログラムになってしまいました。そのため、ここに簡単なコード解説を記しておこうと思います。誰も読まないのかもしれませんが。

## それぞれのファイルについて

### HTMLファイル(.html)

Webサイトのテキストや画像、構造が書いてあるファイル。Webページの根幹をなす。ここではindex.html（トップページ）とscore.html（楽譜）の2種類。

### CSSファイル(.css)

Webページの見た目を整えるファイル。具体的には、背景色、文字の色、余白、枠線などを作っています。ここでは、style.css(index.html用)とscore.css(score.html用)の2種類ある。

### JavaScriptファイル(.js)

ユーザーの動きに合わせてWebページを変化させるファイル。ここでは、音源の再生を主に行なっている。ここでは、main.js(音源の再生、その他)とscore.js(パスワードのチェック、解除)を行う2種類ある。このサイトではjQueryというライブラリも合わせて利用している。また、よくJavaと混同されるが、全くの別物（メロンとメロンパンみたいに）であるので気をつけてほしい。

### README.md

これは今読んでいる解説を書いたファイル。サイトとは関係がない。

### .gitignore

Gitというバージョン管理システム（元のバージョンに戻せるようにするシステム）の設定ファイル。無視して良い。

### favicon.ico

このサイトのアイコン。ブラウザのタブの左側に表示されるあれ。

### audiosフォルダー

音源が格納されているフォルダー。なお、「全て.mp3」は使ってない。

### iconsフォルダー

再生、一時停止、リピート、戻るなどのアイコンファイルが入っている。

### imgsフォルダー

favicon.icoと同様、このサイトのアイコンが入っている。

### libraryフォルダー

この中にはjQueryというライブラリのファイルがある。jquery-3.7.1.min.jsは僕が書いたファイルでないし、読むものではない。開かないことを推奨する。

### scoresフォルダー

この中には楽譜のファイルがある。ここに格納されているファイルにはパスワードはかかってないので、javascriptで改めて作っている。

## jQueryについて

jQueryとは、Javascriptのライブラリ（誰かが書いたコードを公開して、みんなが使えるようにする）の一つで、htmlのタグをCSSみたいに取得して、コードをシンプルにできるのが特徴。興味があったら調べてみるといいと思う。

## HTMLの解説

書くのが面倒なので、AIに作ってもらったのを転載する。

これらのファイルは、合唱曲「なんでもないや」の練習や鑑賞をサポートするためのWebページを構成しています。score.html は楽譜を表示するページ、index.html は音源再生や歌詞表示など、メインの機能を提供するページです。

### score.html (楽譜ページ)

このファイルは、合唱曲「なんでもないや」の楽譜を画像として表示し、パスワードで保護する機能を備えています。

#### 解説1

#### 1. ドキュメント構造 `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`

- `<!DOCTYPE html>`: HTML5文書であることを宣言。
- `<html lang="ja">`: ルート要素。lang="ja" はコンテンツの言語が日本語であることを示します。
- `<head>`: メタデータ（文書に関する情報）を含みます。
  - `<meta charset="UTF-8">`: 文字コードをUTF-8に設定。日本語を含む多言語をサポートします。
  - `<meta http-equiv="X-UA-Compatible" content="IE=edge">`: Internet Explorerで最新のレンダリングモードを使用するように指示。
  - `<meta name="viewport" content="width=device-width" initial-scale="1.0">`: レスポンシブデザインのためのビューポート設定。
  - `<title>なんでもないや 音源 楽譜</title>`: ブラウザのタブに表示されるタイトル。「なんでもないや 音源 楽譜」と表示されます。
  - `<link rel="stylesheet" href="./score.css">`: 外部CSSファイル（`score.css`）へのリンク。このページのスタイルを定義します。
  - `<meta http-equiv="default-style" content="./score.css">`: デフォルトのスタイルとして`score.css`を読み込みます。
  - `<link rel="shortcut icon" href="./favicon.ico" type="image/vnd.microsoft.icon" />`: ファビコン（ブラウザタブに表示されるアイコン）の設定。
  - `<link rel="icon" href="./favicon.ico" type="image/vnd.microsoft.icon" />`: サイトのアイコンの設定。
  - `<link rel="apple-touch-icon" href="./imgs/apple-touch-icon.png">`: appleデバイス用のアイコンの設定。
  - `<meta name="description" content="なんでもないや 楽譜">`: 検索エンジン向けのページ説明。
  - `<meta name="author" content="Rio Gunawan">`: ページ作成者の名前。
  - `<meta name="robots" content="noindex">` と`<meta name="robots" content="nofollow">`: 検索エンジンのクローラーに、このページをインデックスせず、リンクをたどらないように指示。楽譜を非公開にするためです。
  - `<script src="./library/jquery-3.7.1.min.js" crossorigin="anonymous"></script>`: jQueryライブラリを外部ファイルから読み込み。
- `<body>`: ページに表示されるコンテンツを含みます。

#### 2. パスワード保護 (`<div class="password_screen">`, `<form>`, `<input>`, `<button>`)

- `<div class="password_screen">`: パスワード入力フォームを囲むコンテナ。
- `<p><label class="password_label" ...>`: ユーザーにパスワード入力を促す説明文。パスワードの有効期限が14日間であることを示しています。
- `<form onsubmit="checkPassword();return false;">`:
    `onsubmit="checkPassword();return false;"`: フォームが送信されたときに、JavaScript関数 `checkPassword()` （`score.js` 内で定義）を呼び出してパスワードを検証します。`return false;` はページの再読み込みなどのデフォルトのフォーム送信動作をキャンセルします。
- `<input type="password" id="password_input" ...>`: パスワード入力欄。
  - `type="password"`: 入力されたテキストをアスタリスクやドットで隠します。
  - `id="password_input"`: JavaScriptやCSSで要素を参照するためのID。
  - `placeholder="パスワードを入力してください"`: 入力がないときのプレースホルダー。
  - `autocomplete="on"`: パスワードの自動補完を許可します。
- `<button id="check">確認</button>`: 「確認」ボタン。
  - `id="check"`: JavaScriptやCSSでボタンを参照するためのID。
  - `<p class="password_mismatch">パスワードが間違っています。</p>`: パスワードが間違っている場合にJavaScriptで表示されるメッセージ

#### 3. 楽譜画像 (`<img>`)

- `<img src="./scores/1.jpg" alt="楽譜1枚目">`: このタグとその後ろに続く8つの`<img>`タグで、楽譜の9ページ分を表示しています。
  - `src="./scores/1.jpg"`: 画像ファイルへのパス。
  - `alt="楽譜1枚目"`: 画像の代替テキスト（「楽譜1枚目」）。アクセシビリティや画像が表示されない場合に重要です。

#### 4. 著作権表示 (`<p>`)

- `<p>無断転載厳禁</p>`: 「無断転載厳禁」という著作権表示。

#### 5. JavaScriptの読み込み (`<script>`)

- `<script src="./score.js"></script>`: 外部JavaScriptファイル `score.js` を読み込み。パスワード検証などの処理を担っている。

#### score.html のまとめ

楽譜をパスワードで保護しています。
9枚の画像として楽譜を表示します。
著作権表示により、無断複製を禁止しています。
jQueryとJavaScript (score.js) を使用して機能拡張しています。
metaタグを使ってブラウザと検索エンジンに対して情報を表示しています。

### index.html (メインページ)

このファイルは、合唱曲「なんでもないや」の音源を再生するためのメインページです。音量調節、歌詞表示、楽譜へのリンクなど、多機能な構成になっています。

#### 解説2

#### 1. ドキュメント構造 (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`)

- `score.html` とよく似た構造で、以下の要素があります。
- `<!DOCTYPE html>`, `<html lang="ja">`, `<head>`, `<meta>` タグ (文字コード、互換性、ビューポート、タイトルなど)。
- `<title>なんでもないや 音源</title>`: ブラウザタブのタイトル（「なんでもないや 音源」）。
- `<link rel="stylesheet" href="./style.css">`: スタイル定義のためのCSSファイルへのリンク。
- `<meta http-equiv="default-style" content="./style.css">`: デフォルトのスタイルとしてstyle.cssを読み込みます。
- `<link rel="shortcut icon" href="./favicon.ico" type="image/vnd.microsoft.icon" />` & `<link rel="icon" href="./favicon.ico" type="image/vnd.microsoft.icon" />`: ファビコンとサイトアイコン。
- `<link rel="apple-touch-icon" href="./imgs/apple-touch-icon.png">`: apple デバイス用のアイコン。
- `<meta name="description" content="なんでもないや 音源">`: 検索エンジン用のページ説明。
- `<meta name="author" content="Rio Gunawan">`: 作成者名。
- `<meta name="robots" content="noindex, nofollow">`: `score.html` と同様に、検索エンジンにページをインデックスしないよう指示。
- Open Graph メタタグ (`<meta name="og:...">`): ソーシャルメディアでの共有時に表示される情報を定義。
  - `<meta name="og:url" content="https://rio-gunawan.github.io/chorus">`: サイトのURL。
  - `<meta name="og:type" content="website">`: コンテンツのタイプ。
  - `<meta name="og:title" content="なんでもないや 音源">`: ソーシャルメディアで表示されるタイトル。
  - `<meta name="og:description" ...>`: ソーシャルメディアで表示される説明文。
  - `<meta property="og:site_name" content="なんでもないや 音源">`: ソーシャルメディアで表示されるサイト名。
  - `<meta property="og:image" content="https://rio-gunawan.github.io/chorus/imgs/icon.png">`: ソーシャルメディアで表示される画像。
- `<script src="./library/jquery-3.7.1.min.js" crossorigin="anonymous"></script>`: Jqueryの読み込み。

#### 2. ローディング画面 (`<div class="loading">`)

- `<div class="loading">`: ローディングアニメーションを囲むコンテナ。
  - `<p class="loading-text">Loading...</p>`: ローディング中に表示されるテキスト。
  - `<div class="spinner"></div>`: CSSでスタイル付けされたスピナー。

#### 3. ヘッダー (`<header>`, `<h1>`)

- `<header>`: ページのヘッダー部分。
- `<h1>`なんでもないや 音源</h1>: メインの見出し（「なんでもないや 音源」）。

#### 4. タブナビゲーション (`<div class="tab_wrap">`, `<input>`, `<label>`, `<div class="panel_area">`)

- `<div class="tab_wrap">` タブインターフェース全体のコンテナ。
- `<input id="tab1" type="radio" name="tab_btn" checked>`: 非表示のラジオボタン。どのタブが選択されているかを制御します。
- `<div class="tab_area">`: タブラベルのコンテナ。
  - `<label class="tab1_label" for="tab1" ...>`: クリック可能なタブラベル。`for`属性でラジオボタンと関連付けられています。
  - `role="tab"`: スクリーンリーダーに、要素がタブとして機能することを伝えます。
  - `aria-controls="panel1"`: コントロールするパネルのIDを示します。
  - `aria-selected="true"`: 選択されているタブを示します。
- `<div class="panel_area">`: コンテンツパネルのコンテナ。
  - `<div id="panel1" class="tab_panel" ...>`: 音声設定のパネル。
  - `role="tabpanel"`: スクリーンリーダーに要素がタブパネルとして機能することを伝えます。
  - `aria-labelledby="tab1"`: 関連付けられているタブを示します。

#### 5. 音声設定 (Panel 1)

- さまざまな設定が含まれています。
  - `alert_text`: サイレントモードでは音が出ない場合があることをアラートで知らせます。
  - `common_setting`: すべてのパートに共通する設定。
  - `instrument_type_container`: ボカロとピアノを選択できます。
  - `volume`: 音量を変更できます。
  - `preset`: 簡単に音源を変更する為のプリセット。
  - `details`: 高度な設定を行うことができます。
  - `part_setting`: 各パートの個別設定を変更できます。
  - `mute/solo` ボタン: 各パートをミュートしたり、ソロにしたりするボタン。
- このセクションは、`range`から`text`、`checkbox`から`radio`まで、さまざまなタイプの多くの入力を備えています。

#### 6. 歌詞 (Panel 2)

- `<div class="lyrics">`: 歌詞のコンテナ。
  - `<p class="info">`: 歌詞についてのメッセージを表示。
  - `<span class="block" id="0_sec">A</span>`: 歌詞の「セクション」（A, B, C など）。
  - `<p class="lyrics_row" id="0">`: 歌詞の各行。小説番号付き。
    - `<span class="bar_num">1</span>`: 小説番号を表示。

#### 7. 楽譜 (Panel 3)

- `<a href="./score.html" target="_blank" class="score_btn">`: score.html を新しいブラウザタブで開くためのリンク。
  - `target="_blank"`: リンクを新しいタブで開きます。
- `<iframe id="score" src="./score.html">`: score.html をページ内に直接埋め込むための iframe。
  - `id="score"`: JavaScriptやCSSで参照するためのID。
  - `src="./score.html"`: 他のページへのリンク。
  - `iframe`をサポートしていないブラウザへのエラーメッセージ。

#### 8. フッター

- `<p>&copy; 2025 Rio Gunawan</p>`: 著作権表示。
- GitHubリポジトリへのリンク。
- 音声ソースへのクレジット。
- 使用したソフトウェアの記述。
- プライバシーに関する記述。

#### 9. プレイヤーコントロール

- `<div id="bottom_menu">`: 下部に固定されたコンテナ。
- `<input type="range" id="progress_bar" ...>`: プログレスバー。
- `<div id="player">`: ボタン類のコンテナ。
- `<button id="prev" ...>`: 前へボタン。
- `<button id="play_and_pause" ...>`: 再生/一時停止ボタン。
  - アイコンとして2つのsvg要素(`<svg id="play">`と`<svg id="pause">`)が使われている。
- `<button id="repeat" ...>`: リピートボタン。
- `<span id="current_time">`と`<span id="duration_time">`: オーディオの経過時間と合計時間を表示。

#### 10. 空白スペース

- `<div class="blank"></div>`: 間隔調整用。

#### 11. JavaScriptの読み込み

- `<script src="main.js"></script>`: JavaScriptファイル main.js を読み込み。このページのインタラクティブな要素（音声、タブなど）を制御します。

#### index.html のまとめ

- **ウェブサイトのメインページ**です。
- **多機能**です：音声制御、歌詞表示、楽譜へのリンク。
- **タブインターフェース**でコンテンツを整理。
- `**score.html`を`iframe`で埋め込み。
- **ローディング画面**あり。
- **著作権表示、クレジット、プライバシー**に関する情報。
- **ソーシャルメディア**のためのOpen Graphメタタグ（LINE共有用）。
- **多くの入力型**が備わっている。
- **多くのボタン**が備わっており、アイコンはsvgで表示。
- **javascript** (`main.js`) で全てのロジックを処理している。
- **meta**タグを使ってブラウザと検索エンジンに対して情報を表示しています。

### score.html と index.html の関係

- `score.html` は、**楽譜を表示するための独立したリソース**（サブページ）。(筆者補足: `score.html`は別のタブでも開けるように作りました。)
- `index.html` は**メインページ**であり：
  - **新しいタブ**で `score.html` にリンク。
  - `iframe` で `score.html` を埋め込み。
  - `main.js` から呼び出し

## CSSの解説

このプロジェクトでは、`style.css` と `score.css` の2つのCSSファイルを使用しています。それぞれ、`index.html`（メインページ）と `score.html`（楽譜ページ）の見た目を整える役割を担っています。

### `style.css` (`index.html` 用)

`style.css` は、`index.html` のスタイルを定義しています。このファイルでは、以下のようなスタイリングが行われています。

- #### 全体的なスタイル

  - フォントファミリー、文字サイズ、文字色、行間などの基本スタイルを設定。
  - 背景色、余白などのページ全体のレイアウトに関連するスタイルを設定。
  - レスポンシブデザインのため、画面サイズに応じたスタイルの調整。

- #### ローディング画面

  - `loading` クラスを使って、ローディング画面の表示・非表示を制御。
  - `spinner` クラスでスピナーのスタイルを定義（アニメーションなど）。

- #### ヘッダー

  - `header` タグと `h1` タグのスタイルを設定。
  - タイトル文字の大きさ、配置、背景色などを定義。

- #### タブナビゲーション

  - `tab_wrap`、`tab_area`、`panel_area` クラスを使ってタブ全体の配置とコンテナを設定。
  - `tab1_label`、`tab2_label`、`tab3_label` クラスで、タブのラベルのスタイルを設定。
  - タブが選択されているときのスタイル。
  - `tab_panel` クラスで、各タブの内容表示部分のスタイルを設定。
- **音声設定パネル:**
  - `common_setting` や `part_setting`、`setting_panel`などの各セクションを定義。
  - `type` `volume` `preset`クラスで、各設定の表示と間隔を調整。
  - `instrument_type_container`クラスで、ボカロとピアノの切り替え設定。
  - `inputRange`クラスで、音量調整の範囲選択のスタイルを調整。
  - `inputText`クラスで、音量を表示しているテキストのスタイルを調整。
  - `inputSelect`クラスで、プリセット選択のセレクトボックスのスタイルを調整。
  - `label_for_checkbox`クラスで、メトロノーム入りかどうかのチェックボックスのスタイルを調整。
  - `details`、`summary`を使って詳細設定の部分を隠せるようにしている。
  - `mute`/`solo` ボタンのスタイルを定義。

- #### 歌詞パネル

  - `lyrics` クラスで歌詞全体のスタイルを設定。
  - `info` クラスで歌詞に関する情報を表示。
  - `block` クラスで歌詞のセクション分け（A, B, Cなど）のスタイルを設定。
  - `lyrics_row` クラスで歌詞の各行のスタイルを設定。
  - `bar_num`クラスで、小説番号の表示を調整。

- #### 楽譜パネル

  - `score_btn` クラスで楽譜ページへのリンクのスタイルを設定。
  - `iframe` のスタイルを設定。

- #### フッター

  - `footer` タグのスタイルを設定。
  - 著作権表示、クレジット表示などのスタイル。

- #### プレイヤーコントロール

  - `bottom_menu` IDを使って、プレイヤーコントロールをページ下部に固定。
  - `progress_bar_container` クラスで、プログレスバーを囲んでいる。
  - `player_container`クラスで、各ボタンを配置。
  - `player` クラスで、各ボタンを配置。
  - `prev`/`play_and_pause`/`repeat` ボタンのスタイルを定義。
  - 各ボタンのsvgのサイズと色を定義。
  - オーディオの再生時間と総時間の表示を定義。

- #### 空白スペース

  - `blank`クラスで余白を調整。

- #### レスポンシブデザイン

  - 画面幅に応じて、各要素の配置や大きさを調整。
  - メディアクエリ(`@media`)を用いて、タブレットやスマートフォンなどの画面サイズに合わせてスタイルを変更。
  - 文字の大きさを調整。
  - 音声の設定パネルを調整。
  - 歌詞のパネルを調整。
  - メトロノームの注釈を調整。

- #### その他

  - 音量が高すぎる場合のアラート。

#### `style.css` のまとめ

`style.css` は、`index.html` のすべての要素に対して、その見た目や配置を定義し、ユーザーが快適に利用できるように調整しています。また、レスポンシブデザインも考慮されており、さまざまなデバイスで最適な表示になるように工夫されています。

### `score.css` (`score.html` 用)

`score.css` は、`score.html` のスタイルを定義しています。このファイルでは、主に以下のスタイリングが行われています。

- #### 全体のスタイル

  - 基本フォントファミリー、背景色、文字色などの基本スタイルを設定。
  - 文字の大きさを調整。

- #### パスワード保護画面

   `password_screen` クラスで、パスワード入力フォーム全体のスタイルを設定。
  - `password_label` クラスで、パスワード入力の説明文を設定。
  - パスワード入力欄 (`input[type="password"]`) のスタイルを設定。
  - `check` IDで「確認」ボタンのスタイルを設定。
  - `password_mismatch` クラスで、パスワードが間違っている場合に表示するメッセージのスタイルを設定。

- #### 楽譜画像

  - `img` タグのスタイルを設定。
  - 楽譜画像の大きさや配置を設定。

- #### 著作権表示

  - 著作権表示の`p`タグのスタイルを設定。

#### `score.css` のまとめ

`score.css` は、主にパスワード入力画面と楽譜画像の表示を制御しています。特に、楽譜が見やすいように画像サイズを調整したり、パスワード入力画面をわかりやすくするスタイルが設定されています。

---

### 補足

- 具体的なCSSのプロパティや値（`color: red;` や `font-size: 16px;` など）の詳細は省略しました。これは、`README.md` ファイルの趣旨が、コードの詳細な仕様を説明するのではなく、全体的な構造や役割を理解するためのものだからです。
- 今回のコードはレスポンシブデザインです。
- このCSSは、ブラウザのデフォルト設定を上書きしています。

## JavaScript の解説

このプロジェクトでは、`main.js` と `score.js` の2つのJavaScriptファイルを使用しています。それぞれ、`index.html`（メインページ）と `score.html`（楽譜ページ）の動的な機能を制御する役割を担っています。

### `main.js` (`index.html` 用)

`main.js` は、`index.html` の動的な機能（音源再生、タブ切り替え、歌詞表示など）を制御しています。このファイルでは、主に以下の処理が行われています。

#### 1. DOM の読み込み完了後の処理

- `$(document).ready(function(){ ... });`: DOM（HTML要素）の読み込みが完了してから実行される処理を定義。これにより、HTML要素が存在しない状態でJavaScriptが実行されるのを防ぎます。

#### 2. ローディング画面の制御

- `$(window).on("load", function () { ... });`: ページのすべての要素 (画像などを含む) の読み込みが完了したら、ローディング画面を非表示にする処理を実行。

#### 3. タブナビゲーションの制御

- タブのラベル(`label`)がクリックされた時の処理を定義。
- クリックされたタブに対応するパネル(`tab_panel`)を表示し、他のタブを非表示にする。
- タブの選択状態を`aria-selected`で管理する。

#### 4. 音源の再生制御

- 各パートの音声ファイル (`<audio>`) を取得。
- 各パートのミュートやソロの処理。
- ボカロとピアノの切り替え。
- プリセットの選択。
- メトロノームの有無。
- 全体の音量調整を、範囲選択入力とテキスト入力で同期させる。
- 各パートの音量調整。
- 再生ボタン (`play_and_pause`) のクリック時の処理を定義。
- 一時停止ボタン (`pause`) のクリック時の処理を定義。
- 前のボタン (`prev`) のクリック時の処理を定義。
- リピートボタン(`repeat`)のクリック時の処理を定義。
- プログレスバー (`progress_bar`) の更新処理（再生時間に合わせて動く）。
- 再生時間と総時間の表示。

#### 5. 歌詞表示

- 歌詞の各行 (`lyrics_row`) を取得。
- 音声の再生時間に合わせて、対応する歌詞の色を変更。

#### 6. その他の処理

- 音声が再生できない場合のアラート。
- iframeの読み込みの失敗を検知。
- 画面サイズが変更されたときの処理。

#### 使用ライブラリ

- jQuery: DOM操作やイベント処理を簡単に行うために使用。

### `score.js` (`score.html` 用)

`score.js` は、`score.html` のパスワード保護機能を制御しています。このファイルでは、主に以下の処理が行われています。

#### 1. パスワード検証

- `checkPassword()`: フォームが送信された際に呼び出される関数。
- 入力されたパスワードを取得。
- 正しいパスワードと比較。
  - パスワードが正しい場合は、パスワード画面を非表示にし、楽譜を表示。
  - パスワードが間違っている場合は、エラーメッセージを表示。
- パスワードの有効期限を計算し表示。
- クッキーにパスワードの情報を保存する。
- クッキーからパスワード情報を読み込む。
- 画面を開いたときに、クッキーに情報が入っていたら、パスワード画面をスキップする。

#### 使用ライブラリの一覧

- jQuery: DOM操作やイベント処理を簡単に行うために使用。

---

**補足:**

- この解説では、具体的なコードは記述していません。JavaScriptファイルがどのような処理を行っているかの概要を把握することを目的としています。詳しくはファイル内のコメントを参考にしてください。
- jQueryが使用されていることがわかるようにしています。
- score.jsではクッキーを使用していることがわかります。
- main.jsでは音声制御に加えて、同期させていることを記述。
