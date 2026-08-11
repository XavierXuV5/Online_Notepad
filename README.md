# Online Notepad & File Manager — デプロイ・仕様書

🌐 **[日本語 (Japanese)](README.md) | [简体中文 (Simplified Chinese)](README_zh.md)**

パスワード保護付きの多機能オンラインメモ帳およびファイル管理システム。
JAIST 共有 Web サーバー（Solaris 10 / Perl CGI）環境および Linux / Unix 環境で動作します。

---

## ✨ 主な機能

- **メモ機能（Notepad）**
  - `.txt`（プレーンテキスト）および `.md`（Markdown）対応
  - リアルタイム Markdown プレビュー、ツールバーショートカット、エディタショートカット（`Ctrl+B`, `Ctrl+I`, `Ctrl+K`, `Ctrl+Shift+P`）
  - 目次アウトライン（TOC）自動生成＆スムーズスクロール
  - オフライン下書き自動保存（`localStorage`）＆一鍵復元プロンプト
  - ノートの自動読み込み・保存・名前変更・削除

- **ファイル管理（File Manager）**
  - ファイルのアップロード・削除・直リンク URL コピー
  - リアルタイムファイル検索インプット＆種類別タブフィルター（画像 / ドキュメント / アーカイブ / 動画）
  - 全画面ガラスモーフィズム・ドラッグ＆ドロップ（Drag & Drop Overlay）アップロード
  - ストレージ容量のビジュアル表示（使用量/空き容量/全容量/使用率バー）

- **マルチフォーマット全画面プレビュー (Lightbox)**
  - **画像**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`
  - **動画**: `.mp4`, `.webm`, `.ogg`, `.mov`（インライン再生）
  - **PDF**: 内蔵 PDF リーダー表示
  - **Office ドキュメント**: `.ppt`, `.pptx`, `.doc`, `.docx`, `.xls`, `.xlsx`（Microsoft Office Online 連携）
  - **アーカイブ**: `.zip`, `.7z`, `.rar`, `.tar`, `.gz`, `.epub`, `.jar`（Windows エクスプローラー風ディレクトリツリー解析、文字化け自動修復 `fixEncoding`、暗号化 7z パスワード対応、内蔵 PDF/画像/テキストの無損プレビュー対応）

- **サーバーシステム情報ダッシュボード（Server Info）**
  - CPU 構成（コア数・平均ロード・アーキテクチャ）
  - 全物理メモリ / 空きメモリ (RAM)
  - アクティブプロセス数、OS & カーネル、ホスト名、Uptime、Perl バージョン

- **セキュリティ & 互換性**
  - ソルト付きハッシュ保護
  - サーバーサイド セッション管理（HttpOnly + SameSite=Strict）
  - パストラバーサル攻撃対策
  - POSIX 互換 Shebang (`#!/usr/bin/env perl`) & `.gitattributes` による LF 改行保持

---

## 🕒 最近の更新・修正履歴 (Change Log)

- **前端 ES Modules 構造への全面リファクタリング**
  - 従来の単一 `app.js` (1500+行) を `js/main.js` および `js/modules/` (API, Theme, Notepad, FileManager, TreeExplorer, Lightbox) に分割モジュール化。
- **WebAssembly オンデマンド遅延読み込み (Lazy Loading)**
  - `libarchive.wasm` モジュールを初回 `.7z` プレビュー時のみ動的 `import()` するよう改善。首屏ロード時間を大幅短縮。
- **Windows エクスプローラー風ツリー表示 & 文字化け自動修復 (`fixEncoding`)**
  - アーカイブプレビューを多層折りたたみツリー構造に刷新。Windows 環境で圧縮された GBK / CP1252 エンコードの日本語・中国語文字化けを自動判定して正常復元。
- **UI/UX 強化**
  - 全画面ドラッグ＆ドロップ、リアルタイム検索＆カテゴリフィルター、Markdown 目次 (TOC) を追加。UI テキストを完全標準日本語化。
- **Perl CGI Linux / Unix 互換性修正**
  - 脚本の改行コードを CRLF から Unix LF に固定。Shebang を `#!/usr/bin/env perl` に統一。

---

## 📁 ファイル構成

```
Online_Notepad/
├── index.html          ← メイン HTML ページ
├── style.css           ← モダンデザイン CSS スタイルシート
├── js/                 ← フロントエンド ES Modules ディレクトリ
│   ├── main.js         ← メインエントリーポイント
│   └── modules/
│       ├── api.js          ← API 通信 & ユーティリティ (AbortController 超時制御)
│       ├── theme.js        ← テーマ切り替え制御 (Light / Dark / Sumeru)
│       ├── notepad.js      ← メモ CRUD & Markdown エディタ & 下書き自動保存 & TOC 目次
│       ├── fileManager.js  ← ファイル管理 & リアルタイム検索/タグフィルター & ドラッグオーバーレイ
│       ├── treeExplorer.js ← Windows 風アーカイブツリー構造 & WebAssembly 遅延読み込み
│       └── lightbox.js     ← 全画面プレビュー Modal
├── icon.png            ← サイトアイコン
├── Xumi.webp / nahida.webp ← カスタムテーマ背景
├── setup.pl            ← セットアップスクリプト
├── libarchive/         ← .7z アーカイブ解凍用 JS/WASM モジュール (WebAssembly Lazy Load)
│   ├── main.js
│   ├── worker-bundle.js
│   └── libarchive.wasm
├── cgi-bin/
│   ├── auth.pl         ← 認証 API (chmod 755)
│   ├── notes.pl        ← メモ CRUD API (chmod 755)
│   └── upload.pl       ← ファイルアップロード & サーバー情報 API (chmod 755)
├── notes/              ← メモ保存ディレクトリ (chmod 755)
└── uploads/            ← アップロードファイル保存先 (chmod 755)
```

---

## 🚀 デプロイ手順

### 1. ファイルをアップロード

SCP または SFTP（WinSCP 等）で `Online_Notepad/` ディレクトリごとサーバーへアップロード：

```bash
# SCPの例
scp -r Online_Notepad/ ユーザー名@sshserv.jaist.ac.jp:~/public_html/
```

### 2. 初回セットアップ（SSH）

```bash
ssh ユーザー名@sshserv.jaist.ac.jp
cd ~/public_html/Online_Notepad
perl setup.pl
```

### 3. パーミッション設定

各 CGI スクリプトおよび保存用ディレクトリのパーミッションを確認してください：

```bash
chmod 755 cgi-bin/auth.pl cgi-bin/notes.pl cgi-bin/upload.pl
chmod 755 notes/ uploads/
```
