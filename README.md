# Online Notepad & File Manager — デプロイ・仕様書

パスワード保護付きの多機能オンラインメモ帳およびファイル管理システム。
JAIST 共有 Web サーバー（Solaris 10 / Perl CGI）環境で動作します。

---

## ✨ 主な機能

- **メモ機能（Notepad）**
  - `.txt`（プレーンテキスト）および `.md`（Markdown）対応
  - リアルタイム Markdown プレビュー、ツールバーショートカット
  - ノートの自動読み込み・保存・削除

- **ファイル管理（File Manager）**
  - ファイルのアップロード・削除・直リンク URL コピー
  - ストレージ容量のビジュアル表示（使用量/空き容量/全容量/使用率バー）

- **マルチフォーマット全画面プレビュー**
  - **画像**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`
  - **動画**: `.mp4`, `.webm`, `.ogg`, `.mov`（インライン再生）
  - **PDF**: 内蔵 PDF リーダー表示
  - **Office ドキュメント**: `.ppt`, `.pptx`, `.doc`, `.docx`, `.xls`, `.xlsx`（Microsoft Office Online 連携）
  - **アーカイブ**: `.zip`, `.7z`, `.rar`, `.tar`, `.gz`, `.epub`, `.jar`（ディレクトリ構造解析・解凍前サイズ表示・内蔵 PDF/画像/テキストのプレビュー対応）

- **サーバーシステム情報ダッシュボード（Server Info）**
  - CPU 構成（コア数・平均ロード・アーキテクチャ）
  - 全物理メモリ / 空きメモリ (RAM)
  - アクティブプロセス数、OS & カーネル、ホスト名、Uptime、Perl バージョン

- **セキュリティ**
  - ソルト付きハッシュ保護
  - サーバーサイド セッション管理（HttpOnly + SameSite=Strict）
  - パストラバーサル攻撃対策

---

## 📁 ファイル構成

```
Online_Notepad/
├── index.html          ← メインページ
├── style.css           ← スタイルシート
├── app.js              ← フロントエンド制御 JS
├── icon.png            ← サイトアイコン
├── setup.pl            ← セットアップスクリプト
├── libarchive/         ← .7z アーカイブ解凍用 JS/WASM モジュール
│   ├── main.js
│   ├── worker-bundle.js
│   └── libarchive.wasm
├── cgi-bin/
│   ├── auth.pl         ← 認証 API (chmod 755)
│   ├── notes.pl        ← メモ CRUD API (chmod 755)
│   ├── upload.pl       ← ファイルアップロード & サーバー情報 API (chmod 755)
│   ├── config.pl       ← 設定ファイル (chmod 644)
│   └── sessions/       ← セッションファイル保存先 (chmod 700)
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
chmod 644 cgi-bin/config.pl
chmod 700 cgi-bin/sessions/
chmod 755 notes/ uploads/
```

---

## 🔐 セキュリティ設定

- パスワードはソルト付きハッシュ值として `cgi-bin/config.pl` に安全に保管されます。
- パスワードの変更は、ログイン後に設定画面より実施してください。
- `setup.pl` 実行後はセキュリティ確保のため同スクリプトの削除を推奨します。

---

## ⚠️ 注意事項

- `uploads/` ディレクトリ内のファイルは直接 URL アクセスが可能です。
- 大容量アーカイブ解凍プレビューは、ブラウザの WebAssembly またはサーバー環境に依存します。
