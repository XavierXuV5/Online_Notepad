/* ============================================================
   Online Notepad — Internationalization (i18n) Module
   Trilingual support: Japanese (ja, default), Chinese (zh), English (en)
   ============================================================ */

const translations = {
  ja: {
    // Auth & Lock screen
    'lock.title': 'Online Notepad',
    'lock.subtitle': 'パスワードを入力してください',
    'lock.placeholder': 'パスワード',
    'lock.unlock': '開く',
    'lock.footer': 'MD5 暗号化ハッシュで保護',
    'auth.error_wrong': 'パスワードが違います。もう一度お試しください。',
    'auth.error_network': '接続エラーが発生しました',
    'auth.error_required': 'パスワードを入力してください',

    // Sidebar
    'sidebar.brand': 'Notepad',
    'sidebar.close_tooltip': 'サイドバーを閉じる',
    'sidebar.open_tooltip': 'サイドバーを開く',
    'sidebar.tab_notes': 'メモ',
    'sidebar.tab_files': 'ファイル',
    'sidebar.new_note': '新しいメモ',
    'sidebar.upload': 'アップロード',
    'sidebar.search_placeholder': 'ファイルを検索...',
    'sidebar.clear_search': '検索をクリア',
    'sidebar.filter_all': 'すべて',
    'sidebar.filter_image': '画像',
    'sidebar.filter_doc': 'ドキュメント',
    'sidebar.filter_zip': 'アーカイブ',
    'sidebar.filter_video': '動画',
    'sidebar.empty_notes': 'メモがありません',
    'sidebar.empty_files': 'ファイルがありません',
    'sidebar.no_matching_files': '一致するファイルが見つかりません',
    'sidebar.change_password': 'パスワード変更',
    'sidebar.lock': 'ロック',

    // Theme tooltips
    'theme.light': 'ライトテーマ',
    'theme.dark': 'ダークテーマ',
    'theme.sumeru': '須弥テーマ',

    // Toolbar & Editor
    'toolbar.sidebar_tooltip': 'サイドバー',
    'toolbar.untitled': 'タイトルなし',
    'toolbar.save': '保存',
    'toolbar.save_tooltip': '保存 (Ctrl+S)',
    'toolbar.view_mode_tooltip': '表示モード切替',
    'view_mode.edit': '編集',
    'view_mode.split': '分割',
    'view_mode.preview': 'プレビュー',
    'save_status.saved': '保存済み',
    'save_status.saving': '保存中…',
    'save_status.unsaved': '未保存',

    // MD tools
    'md_tool.bold': '太字 **B**',
    'md_tool.italic': '斜体 *I*',
    'md_tool.heading': '見出し #',
    'md_tool.list': 'リスト -',
    'md_tool.quote': '引用 >',
    'md_tool.code': 'コード ```',
    'md_tool.toc': '目次 (TOC)',
    'editor.placeholder': 'ここにメモを入力してください…\n\nヒント：Ctrl+S で保存。',

    // TOC Outline
    'toc.title': '📑 目次アウトライン',
    'toc.close': '目次を閉じる',
    'toc.empty': '見出しがありません',

    // Status Bar
    'stats.words': '{n} 語',
    'stats.chars': '{n} 文字',
    'stats.lines': '{n} 行',
    'stats.read_time': '読了時間: 約 {n} 分',

    // Server Dashboard
    'dashboard.header_title': 'JAIST サーバーシステム情報',
    'dashboard.storage_title': 'ストレージ容量 (/home)',
    'dashboard.storage_pct': '{pct}% 使用中',
    'dashboard.total_space': '総容量:',
    'dashboard.used_space': '使用済み:',
    'dashboard.free_space': '空き容量:',
    'dashboard.cpu_spec': 'CPU 構成',
    'dashboard.cpu_load': 'CPU 平均ロード (Load Average)',
    'dashboard.arch': 'プロセッサ アーキテクチャ',
    'dashboard.ram_total': '全物理メモリ (RAM)',
    'dashboard.ram_free': '空きメモリ (Available RAM)',
    'dashboard.active_proc': 'アクティブ プロセス数',
    'dashboard.os_kernel': 'OS & カーネル',
    'dashboard.hostname': 'ホスト名',
    'dashboard.uptime': 'システム稼働時間 (Uptime)',
    'dashboard.perl_env': 'Perl 実行環境',

    // Modals
    // New Note Modal
    'modal_note.title': '新しいメモを作成',
    'modal_note.name_label': 'メモ名',
    'modal_note.name_placeholder': '例：アイデアメモ',
    'modal_note.fmt_label': 'フォーマット',
    'modal_note.fmt_txt': '.txt（プレーンテキスト）',
    'modal_note.fmt_md': '.md（Markdown）',
    'modal.cancel': 'キャンセル',
    'modal_note.create': '作成',

    // Rename Modal
    'modal_rename.title': 'メモ名を変更',
    'modal_rename.label': '新しい名前',
    'modal_rename.placeholder': '新しい名前',
    'modal_rename.confirm': '変更',

    // Change Password Modal
    'modal_pw.title': 'パスワード変更',
    'modal_pw.current_label': '現在のパスワード',
    'modal_pw.current_placeholder': '現在のパスワード',
    'modal_pw.new_label': '新しいパスワード',
    'modal_pw.new_placeholder': '新しいパスワード',
    'modal_pw.confirm_label': '新しいパスワード（確認）',
    'modal_pw.confirm_placeholder': 'もう一度入力',
    'modal_pw.submit': '変更する',

    // Lightbox & Archive
    'lightbox.close': '閉じる',
    'lightbox.prev': '前へ',
    'lightbox.next': '次へ',
    'archive.uncompressing': 'ZIP アーカイブ解凍中…',
    'archive.wasm_7z': '⚡ WebAssembly (libarchivejs) で .7z アーカイブ解凍中…',
    'archive.encrypted_pass_prompt': '🔒 暗号化された 7z アーカイブです。パスワードを入力してください:',
    'archive.load_error': 'アーカイブ読み込みエラー: {msg}',
    'archive.wasm_error': 'libarchive WebAssembly モジュールの読み込みに失敗しました。',
    'archive.7z_error': '7z アーカイブの解凍に失敗しました: {msg}',
    'archive.partial_view': '... (一部のみ表示)',
    'archive.extracting': '「{path}」解凍中…',
    'archive.extract_error': '解凍エラー: {msg}',
    'archive.preview_link': 'プレビュー',
    'archive.items_count': '{n} 個のアイテム',

    // Drag Overlay
    'drag.title': 'ドロップしてアップロード',
    'drag.subtitle': '複数のファイルを一括でアップロードできます',

    // File Actions & Copy
    'file_action.copy_url': 'URLをコピー',
    'file_action.delete': '削除',

    // Toasts & Messages
    'toast.note_name_required': 'メモ名を入力してください',
    'toast.note_create_failed': '作成失敗: {error}',
    'toast.note_created': '「{name}」を作成しました',
    'toast.note_create_error': 'メモの作成に失敗しました',
    'toast.load_notes_failed': 'メモ一覧の取得に失敗: {error}',
    'toast.read_note_failed': 'メモの読み込みに失敗: {error}',
    'toast.read_note_error': 'メモの読み込みに失敗しました',
    'toast.rename_failed': '名前変更失敗: {error}',
    'toast.save_failed': '保存失敗: {error}',
    'toast.saved_success': '保存しました',
    'toast.save_error': '保存に失敗しました',
    'toast.fill_all_fields': 'すべてのフィールドを入力してください',
    'toast.pw_mismatch': '新しいパスワードが一致しません',
    'toast.pw_min_length': 'パスワードは4文字以上にしてください',
    'toast.pw_changed': 'パスワードを変更しました',
    'toast.pw_change_failed': 'パスワード変更に失敗しました',
    'toast.load_files_failed': 'ファイル一覧の取得に失敗: {error}',
    'toast.url_copied': 'URLをコピーしました',
    'toast.uploading': 'アップロード中: {name}',
    'toast.upload_failed_msg': '失敗: {error}',
    'toast.uploaded_success': '「{name}」をアップロードしました',
    'toast.upload_error': 'アップロードに失敗しました',
    'toast.delete_confirm': '「{filename}」を削除しますか？',
    'toast.delete_failed': '削除失敗: {error}',
    'toast.deleted_success': '削除しました',
    'toast.delete_error': '削除に失敗しました',
    'toast.draft_restore_confirm': '【下書きが検出されました】前回未保存のオフライン下書きを復元しますか？',
    'toast.draft_restored': '下書きを復元しました'
  },
  zh: {
    // Auth & Lock screen
    'lock.title': 'Online Notepad',
    'lock.subtitle': '请输入密码',
    'lock.placeholder': '密码',
    'lock.unlock': '解锁',
    'lock.footer': 'MD5 加密哈希保护',
    'auth.error_wrong': '密码错误，请重试。',
    'auth.error_network': '发生网络连接错误',
    'auth.error_required': '请输入密码',

    // Sidebar
    'sidebar.brand': 'Notepad',
    'sidebar.close_tooltip': '关闭侧边栏',
    'sidebar.open_tooltip': '打开侧边栏',
    'sidebar.tab_notes': '笔记',
    'sidebar.tab_files': '文件',
    'sidebar.new_note': '新建笔记',
    'sidebar.upload': '上传文件',
    'sidebar.search_placeholder': '搜索文件...',
    'sidebar.clear_search': '清除搜索',
    'sidebar.filter_all': '全部',
    'sidebar.filter_image': '图片',
    'sidebar.filter_doc': '文档',
    'sidebar.filter_zip': '压缩包',
    'sidebar.filter_video': '视频',
    'sidebar.empty_notes': '暂无笔记',
    'sidebar.empty_files': '暂无文件',
    'sidebar.no_matching_files': '未找到匹配的文件',
    'sidebar.change_password': '修改密码',
    'sidebar.lock': '锁定锁定',

    // Theme tooltips
    'theme.light': '浅色主题',
    'theme.dark': '深色主题',
    'theme.sumeru': '须弥主题',

    // Toolbar & Editor
    'toolbar.sidebar_tooltip': '侧边栏',
    'toolbar.untitled': '无标题',
    'toolbar.save': '保存',
    'toolbar.save_tooltip': '保存 (Ctrl+S)',
    'toolbar.view_mode_tooltip': '切换显示模式',
    'view_mode.edit': '编辑',
    'view_mode.split': '分屏',
    'view_mode.preview': '预览',
    'save_status.saved': '已保存',
    'save_status.saving': '保存中…',
    'save_status.unsaved': '未保存',

    // MD tools
    'md_tool.bold': '加粗 **B**',
    'md_tool.italic': '斜体 *I*',
    'md_tool.heading': '标题 #',
    'md_tool.list': '列表 -',
    'md_tool.quote': '引用 >',
    'md_tool.code': '代码 ```',
    'md_tool.toc': '目录 (TOC)',
    'editor.placeholder': '在此输入笔记内容…\n\n提示：Ctrl+S 快捷保存。',

    // TOC Outline
    'toc.title': '📑 目录大纲',
    'toc.close': '关闭目录',
    'toc.empty': '暂无标题',

    // Status Bar
    'stats.words': '{n} 词',
    'stats.chars': '{n} 字符',
    'stats.lines': '{n} 行',
    'stats.read_time': '预计阅读时间: 约 {n} 分钟',

    // Server Dashboard
    'dashboard.header_title': 'JAIST 服务器系统信息',
    'dashboard.storage_title': '存储容量 (/home)',
    'dashboard.storage_pct': '{pct}% 已使用',
    'dashboard.total_space': '总容量:',
    'dashboard.used_space': '已使用:',
    'dashboard.free_space': '剩余容量:',
    'dashboard.cpu_spec': 'CPU 配置',
    'dashboard.cpu_load': 'CPU 平均负载 (Load Average)',
    'dashboard.arch': '处理器架构',
    'dashboard.ram_total': '物理内存总计 (RAM)',
    'dashboard.ram_free': '可用内存 (Available RAM)',
    'dashboard.active_proc': '活动进程数',
    'dashboard.os_kernel': '操作系统与内核',
    'dashboard.hostname': '主机名',
    'dashboard.uptime': '系统运行时间 (Uptime)',
    'dashboard.perl_env': 'Perl 运行环境',

    // Modals
    // New Note Modal
    'modal_note.title': '创建新笔记',
    'modal_note.name_label': '笔记名称',
    'modal_note.name_placeholder': '例如：灵感笔记',
    'modal_note.fmt_label': '格式',
    'modal_note.fmt_txt': '.txt（纯文本）',
    'modal_note.fmt_md': '.md（Markdown）',
    'modal.cancel': '取消',
    'modal_note.create': '创建',

    // Rename Modal
    'modal_rename.title': '重命名笔记',
    'modal_rename.label': '新名称',
    'modal_rename.placeholder': '新名称',
    'modal_rename.confirm': '修改',

    // Change Password Modal
    'modal_pw.title': '修改密码',
    'modal_pw.current_label': '当前密码',
    'modal_pw.current_placeholder': '当前密码',
    'modal_pw.new_label': '新密码',
    'modal_pw.new_placeholder': '新密码',
    'modal_pw.confirm_label': '确认新密码',
    'modal_pw.confirm_placeholder': '再次输入新密码',
    'modal_pw.submit': '确认修改',

    // Lightbox & Archive
    'lightbox.close': '关闭',
    'lightbox.prev': '上一张',
    'lightbox.next': '下一张',
    'archive.uncompressing': '正在解压 ZIP 压缩包…',
    'archive.wasm_7z': '⚡ 正在通过 WebAssembly (libarchivejs) 解压 .7z 压缩包…',
    'archive.encrypted_pass_prompt': '🔒 加密的 7z 压缩包，请输入密码：',
    'archive.load_error': '解压读取错误: {msg}',
    'archive.wasm_error': '加载 libarchive WebAssembly 模块失败。',
    'archive.7z_error': '解压 7z 压缩包失败: {msg}',
    'archive.partial_view': '... (仅显示部分内容)',
    'archive.extracting': '正在解压「{path}」…',
    'archive.extract_error': '解压错误: {msg}',
    'archive.preview_link': '预览',
    'archive.items_count': '{n} 个项目',

    // Drag Overlay
    'drag.title': '拖放文件至此以上传',
    'drag.subtitle': '支持批量上传多个文件',

    // File Actions & Copy
    'file_action.copy_url': '复制 URL',
    'file_action.delete': '删除',

    // Toasts & Messages
    'toast.note_name_required': '请输入笔记名称',
    'toast.note_create_failed': '创建失败: {error}',
    'toast.note_created': '已创建「{name}」',
    'toast.note_create_error': '创建笔记失败',
    'toast.load_notes_failed': '获取笔记列表失败: {error}',
    'toast.read_note_failed': '读取笔记失败: {error}',
    'toast.read_note_error': '读取笔记失败',
    'toast.rename_failed': '重命名失败: {error}',
    'toast.save_failed': '保存失败: {error}',
    'toast.saved_success': '保存成功',
    'toast.save_error': '保存失败',
    'toast.fill_all_fields': '请填写所有文本框',
    'toast.pw_mismatch': '两次输入的密码不一致',
    'toast.pw_min_length': '密码长度不能少于 4 位',
    'toast.pw_changed': '密码修改成功',
    'toast.pw_change_failed': '修改密码失败',
    'toast.load_files_failed': '获取文件列表失败: {error}',
    'toast.url_copied': '已复制 URL 至剪贴板',
    'toast.uploading': '正在上传: {name}',
    'toast.upload_failed_msg': '上传失败: {error}',
    'toast.uploaded_success': '已成功上传「{name}」',
    'toast.upload_error': '上传失败',
    'toast.delete_confirm': '确定要删除「{filename}」吗？',
    'toast.delete_failed': '删除失败: {error}',
    'toast.deleted_success': '已成功删除',
    'toast.delete_error': '删除失败',
    'toast.draft_restore_confirm': '【检测到草稿】是否恢复上次未保存的离线草稿？',
    'toast.draft_restored': '已成功恢复草稿'
  },
  en: {
    // Auth & Lock screen
    'lock.title': 'Online Notepad',
    'lock.subtitle': 'Please enter password',
    'lock.placeholder': 'Password',
    'lock.unlock': 'Unlock',
    'lock.footer': 'Protected by MD5 Hash Encryption',
    'auth.error_wrong': 'Incorrect password. Please try again.',
    'auth.error_network': 'A network connection error occurred.',
    'auth.error_required': 'Password is required',

    // Sidebar
    'sidebar.brand': 'Notepad',
    'sidebar.close_tooltip': 'Close Sidebar',
    'sidebar.open_tooltip': 'Open Sidebar',
    'sidebar.tab_notes': 'Notes',
    'sidebar.tab_files': 'Files',
    'sidebar.new_note': 'New Note',
    'sidebar.upload': 'Upload',
    'sidebar.search_placeholder': 'Search files...',
    'sidebar.clear_search': 'Clear search',
    'sidebar.filter_all': 'All',
    'sidebar.filter_image': 'Images',
    'sidebar.filter_doc': 'Docs',
    'sidebar.filter_zip': 'Archives',
    'sidebar.filter_video': 'Videos',
    'sidebar.empty_notes': 'No notes found',
    'sidebar.empty_files': 'No files found',
    'sidebar.no_matching_files': 'No matching files',
    'sidebar.change_password': 'Change Password',
    'sidebar.lock': 'Lock',

    // Theme tooltips
    'theme.light': 'Light Theme',
    'theme.dark': 'Dark Theme',
    'theme.sumeru': 'Sumeru Theme',

    // Toolbar & Editor
    'toolbar.sidebar_tooltip': 'Sidebar',
    'toolbar.untitled': 'Untitled',
    'toolbar.save': 'Save',
    'toolbar.save_tooltip': 'Save (Ctrl+S)',
    'toolbar.view_mode_tooltip': 'Toggle View Mode',
    'view_mode.edit': 'Edit',
    'view_mode.split': 'Split',
    'view_mode.preview': 'Preview',
    'save_status.saved': 'Saved',
    'save_status.saving': 'Saving...',
    'save_status.unsaved': 'Unsaved',

    // MD tools
    'md_tool.bold': 'Bold **B**',
    'md_tool.italic': 'Italic *I*',
    'md_tool.heading': 'Heading #',
    'md_tool.list': 'List -',
    'md_tool.quote': 'Quote >',
    'md_tool.code': 'Code ```',
    'md_tool.toc': 'Table of Contents (TOC)',
    'editor.placeholder': 'Type your note here...\n\nHint: Press Ctrl+S to save.',

    // TOC Outline
    'toc.title': '📑 Table of Contents',
    'toc.close': 'Close TOC',
    'toc.empty': 'No headings found',

    // Status Bar
    'stats.words': '{n} words',
    'stats.chars': '{n} chars',
    'stats.lines': '{n} lines',
    'stats.read_time': 'Read time: ~{n} min',

    // Server Dashboard
    'dashboard.header_title': 'JAIST Server System Info',
    'dashboard.storage_title': 'Storage Capacity (/home)',
    'dashboard.storage_pct': '{pct}% used',
    'dashboard.total_space': 'Total:',
    'dashboard.used_space': 'Used:',
    'dashboard.free_space': 'Free:',
    'dashboard.cpu_spec': 'CPU Specification',
    'dashboard.cpu_load': 'CPU Load Average',
    'dashboard.arch': 'Architecture',
    'dashboard.ram_total': 'Total RAM',
    'dashboard.ram_free': 'Available RAM',
    'dashboard.active_proc': 'Active Processes',
    'dashboard.os_kernel': 'OS & Kernel',
    'dashboard.hostname': 'Hostname',
    'dashboard.uptime': 'System Uptime',
    'dashboard.perl_env': 'Perl Environment',

    // Modals
    // New Note Modal
    'modal_note.title': 'Create New Note',
    'modal_note.name_label': 'Note Title',
    'modal_note.name_placeholder': 'e.g. Idea Note',
    'modal_note.fmt_label': 'Format',
    'modal_note.fmt_txt': '.txt (Plain Text)',
    'modal_note.fmt_md': '.md (Markdown)',
    'modal.cancel': 'Cancel',
    'modal_note.create': 'Create',

    // Rename Modal
    'modal_rename.title': 'Rename Note',
    'modal_rename.label': 'New Name',
    'modal_rename.placeholder': 'New Name',
    'modal_rename.confirm': 'Change',

    // Change Password Modal
    'modal_pw.title': 'Change Password',
    'modal_pw.current_label': 'Current Password',
    'modal_pw.current_placeholder': 'Current Password',
    'modal_pw.new_label': 'New Password',
    'modal_pw.new_placeholder': 'New Password',
    'modal_pw.confirm_label': 'Confirm New Password',
    'modal_pw.confirm_placeholder': 'Re-enter new password',
    'modal_pw.submit': 'Update Password',

    // Lightbox & Archive
    'lightbox.close': 'Close',
    'lightbox.prev': 'Previous',
    'lightbox.next': 'Next',
    'archive.uncompressing': 'Extracting ZIP archive...',
    'archive.wasm_7z': '⚡ Extracting .7z archive using WebAssembly (libarchivejs)...',
    'archive.encrypted_pass_prompt': '🔒 Encrypted 7z archive. Please enter password:',
    'archive.load_error': 'Archive load error: {msg}',
    'archive.wasm_error': 'Failed to load libarchive WebAssembly module.',
    'archive.7z_error': 'Failed to extract 7z archive: {msg}',
    'archive.partial_view': '... (partial content displayed)',
    'archive.extracting': 'Extracting "{path}"...',
    'archive.extract_error': 'Extraction error: {msg}',
    'archive.preview_link': 'Preview',
    'archive.items_count': '{n} items',

    // Drag Overlay
    'drag.title': 'Drop files to upload',
    'drag.subtitle': 'Supports batch uploading multiple files',

    // File Actions & Copy
    'file_action.copy_url': 'Copy URL',
    'file_action.delete': 'Delete',

    // Toasts & Messages
    'toast.note_name_required': 'Please enter a note name',
    'toast.note_create_failed': 'Failed to create: {error}',
    'toast.note_created': 'Created "{name}"',
    'toast.note_create_error': 'Failed to create note',
    'toast.load_notes_failed': 'Failed to load notes: {error}',
    'toast.read_note_failed': 'Failed to read note: {error}',
    'toast.read_note_error': 'Failed to load note',
    'toast.rename_failed': 'Failed to rename: {error}',
    'toast.save_failed': 'Failed to save: {error}',
    'toast.saved_success': 'Saved successfully',
    'toast.save_error': 'Failed to save',
    'toast.fill_all_fields': 'Please fill in all fields',
    'toast.pw_mismatch': 'New passwords do not match',
    'toast.pw_min_length': 'Password must be at least 4 characters',
    'toast.pw_changed': 'Password updated successfully',
    'toast.pw_change_failed': 'Failed to change password',
    'toast.load_files_failed': 'Failed to load files: {error}',
    'toast.url_copied': 'URL copied to clipboard',
    'toast.uploading': 'Uploading: {name}',
    'toast.upload_failed_msg': 'Upload failed: {error}',
    'toast.uploaded_success': 'Uploaded "{name}" successfully',
    'toast.upload_error': 'Upload failed',
    'toast.delete_confirm': 'Are you sure you want to delete "{filename}"?',
    'toast.delete_failed': 'Failed to delete: {error}',
    'toast.deleted_success': 'Deleted successfully',
    'toast.delete_error': 'Failed to delete file',
    'toast.draft_restore_confirm': '[Draft Detected] Would you like to restore the unsaved offline draft?',
    'toast.draft_restored': 'Draft restored successfully'
  }
};

let currentLang = localStorage.getItem('notepad_lang') || 'ja';
const listeners = [];

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('notepad_lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;

  updateDOMTranslations();

  listeners.forEach(fn => {
    try { fn(lang); } catch (e) { console.error('i18n listener error:', e); }
  });
}

export function t(key, vars = {}) {
  const dict = translations[currentLang] || translations.ja;
  let text = dict[key] || translations.ja[key] || key;

  Object.keys(vars).forEach(k => {
    text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
  });
  return text;
}

export function onLanguageChange(fn) {
  if (typeof fn === 'function') {
    listeners.push(fn);
  }
}

export function updateDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });

  // Update active language selector buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang-val') === currentLang);
  });
}

export function initI18n() {
  const saved = localStorage.getItem('notepad_lang') || 'ja';
  setLanguage(saved);
}
