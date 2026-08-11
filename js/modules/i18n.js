/* ============================================================
   i18n Multi-Language Module (Chinese Default, Japanese, English)
   ============================================================ */

const translations = {
  zh: {
    // Lock Screen
    lockTitle: "在线记事本",
    lockSubtitle: "请输入密码以解锁访问",
    passwordPlaceholder: "密码",
    unlockBtn: "解锁",
    authError: "密码错误，请重试。",
    lockFooter: "MD5 加密哈希安全保护",

    // Sidebar
    tabNotes: "笔记",
    tabFiles: "文件",
    newNote: "新建笔记",
    uploadBtn: "上传文件",
    uploadFolderBtn: "上传文件夹",
    newFolderBtn: "新建文件夹",
    searchFilesPlaceholder: "搜索文件...",
    filterAll: "全部",
    filterImage: "图片",
    filterDoc: "文档",
    filterZip: "压缩包",
    filterVideo: "视频",
    sidebarToggle: "切换侧边栏",
    storageUsage: "已使用",

    // Modals & Dialogs
    newNoteTitle: "新建笔记",
    noteNamePlaceholder: "笔记名称",
    cancel: "取消",
    confirm: "确认",
    create: "创建",
    renameTitle: "重命名",
    renamePlaceholder: "请输入新名称",
    newFolderTitle: "新建文件夹",
    folderNamePlaceholder: "文件夹名称",
    changePwTitle: "修改密码",
    currentPwPlaceholder: "当前密码",
    newPwPlaceholder: "新密码",
    confirmPwPlaceholder: "再次确认新密码",
    changePwConfirm: "确认修改",

    // Toolbar & Controls
    save: "保存",
    copyUrl: "复制链接",
    clear: "清空",
    formatTxt: "TXT 纯文本",
    formatMd: "MD 渲染模式",
    previewBtn: "预览",
    exitPreviewBtn: "编辑",
    themeToggle: "切换主题",
    langSelect: "语言",
    changePassword: "修改密码",
    logout: "退出登录",
    serverInfoTitle: "服务器系统信息",

    // Status bar
    wordsCount: "{words} 词",
    charsCount: "{chars} 字符",
    linesCount: "{lines} 行",
    unsaved: "未保存",
    saved: "已保存",

    // File Manager
    noFiles: "暂无文件",
    noMatchFiles: "未找到匹配的文件",
    copyUrlSuccess: "文件链接已复制到剪贴板",
    deleteConfirm: "确定要删除「{name}」吗？",
    deleteSuccess: "已成功删除",
    deleteFail: "删除失败：{error}",
    uploading: "正在上传: {name}",
    uploadSuccess: "成功上传「{name}」",
    uploadFail: "上传失败: {error}",
    mkdirSuccess: "新建文件夹「{name}」成功",
    mkdirFail: "创建文件夹失败: {error}",
    renameSuccess: "重命名成功",
    renameFail: "重命名失败: {error}",
    rootFolder: "根目录",

    // Server Info Dashboard
    serverCpu: "CPU 架构及核心",
    serverLoad: "CPU 平均负载 (Load Avg)",
    serverArch: "处理器指令集",
    serverRamTotal: "全物理内存 (RAM)",
    serverRamFree: "剩余可用内存",
    serverProc: "运行进程总数",
    serverOs: "操作系统 & 内核",
    serverHostname: "服务器主机名",
    serverUptime: "系统运行时间 (Uptime)",
    serverPerl: "Perl 运行环境",

    // Lightbox & Archive
    close: "关闭",
    prev: "上一个",
    next: "下一个",
    archiveUnpacking: "正在解析压缩包目录...",
    archiveEmpty: "该压缩包为空",
    archiveError: "压缩包解压失败"
  },

  ja: {
    // Lock Screen
    lockTitle: "Online Notepad",
    lockSubtitle: "パスワードを入力してください",
    passwordPlaceholder: "パスワード",
    unlockBtn: "開く",
    authError: "パスワードが違います。もう一度お試しください。",
    lockFooter: "MD5 暗号化ハッシュで保護",

    // Sidebar
    tabNotes: "メモ",
    tabFiles: "ファイル",
    newNote: "新しいメモ",
    uploadBtn: "アップロード",
    uploadFolderBtn: "フォルダをアップロード",
    newFolderBtn: "新しいフォルダ",
    searchFilesPlaceholder: "ファイルを検索...",
    filterAll: "すべて",
    filterImage: "画像",
    filterDoc: "ドキュメント",
    filterZip: "アーカイブ",
    filterVideo: "動画",
    sidebarToggle: "サイドバー切替",
    storageUsage: "使用中",

    // Modals & Dialogs
    newNoteTitle: "新しいメモ",
    noteNamePlaceholder: "メモの名前",
    cancel: "キャンセル",
    confirm: "確認",
    create: "作成",
    renameTitle: "名前を変更",
    renamePlaceholder: "新しい名前を入力",
    newFolderTitle: "新しいフォルダ",
    folderNamePlaceholder: "フォルダ名",
    changePwTitle: "パスワードの変更",
    currentPwPlaceholder: "現在のパスワード",
    newPwPlaceholder: "新しいパスワード",
    confirmPwPlaceholder: "もう一度入力",
    changePwConfirm: "変更する",

    // Toolbar & Controls
    save: "保存",
    copyUrl: "URLをコピー",
    clear: "クリア",
    formatTxt: "TXTテキスト",
    formatMd: "MDプレビュー",
    previewBtn: "プレビュー",
    exitPreviewBtn: "編集",
    themeToggle: "テーマ切替",
    langSelect: "言語",
    changePassword: "パスワード変更",
    logout: "ログアウト",
    serverInfoTitle: "JAIST サーバーシステム情報",

    // Status bar
    wordsCount: "{words} 語",
    charsCount: "{chars} 文字",
    linesCount: "{lines} 行",
    unsaved: "未保存",
    saved: "保存済み",

    // File Manager
    noFiles: "ファイルがありません",
    noMatchFiles: "一致するファイルが見つかりません",
    copyUrlSuccess: "URLをコピーしました",
    deleteConfirm: "「{name}」を削除しますか？",
    deleteSuccess: "削除しました",
    deleteFail: "削除失敗: {error}",
    uploading: "アップロード中: {name}",
    uploadSuccess: "「{name}」をアップロードしました",
    uploadFail: "アップロード失敗: {error}",
    mkdirSuccess: "フォルダ「{name}」を作成しました",
    mkdirFail: "フォルダ作成失敗: {error}",
    renameSuccess: "名前を変更しました",
    renameFail: "名前変更失敗: {error}",
    rootFolder: "ルート",

    // Server Info Dashboard
    serverCpu: "CPU 構成",
    serverLoad: "CPU 平均ロード (Load Average)",
    serverArch: "プロセッサ アーキテクチャ",
    serverRamTotal: "全物理メモリ (RAM)",
    serverRamFree: "空きメモリ (Available RAM)",
    serverProc: "アクティブ プロセス数",
    serverOs: "OS & カーネル",
    serverHostname: "ホスト名",
    serverUptime: "システム稼働時間 (Uptime)",
    serverPerl: "Perl 実行環境",

    // Lightbox & Archive
    close: "閉じる",
    prev: "前へ",
    next: "次へ",
    archiveUnpacking: "アーカイブ解析中…",
    archiveEmpty: "空のアーカイブです",
    archiveError: "アーカイブの解凍に失敗しました"
  },

  en: {
    // Lock Screen
    lockTitle: "Online Notepad",
    lockSubtitle: "Enter password to unlock access",
    passwordPlaceholder: "Password",
    unlockBtn: "Unlock",
    authError: "Incorrect password. Please try again.",
    lockFooter: "Protected by MD5 Hash",

    // Sidebar
    tabNotes: "Notes",
    tabFiles: "Files",
    newNote: "New Note",
    uploadBtn: "Upload File",
    uploadFolderBtn: "Upload Folder",
    newFolderBtn: "New Folder",
    searchFilesPlaceholder: "Search files...",
    filterAll: "All",
    filterImage: "Images",
    filterDoc: "Documents",
    filterZip: "Archives",
    filterVideo: "Videos",
    sidebarToggle: "Toggle Sidebar",
    storageUsage: "Used",

    // Modals & Dialogs
    newNoteTitle: "New Note",
    noteNamePlaceholder: "Note Title",
    cancel: "Cancel",
    confirm: "Confirm",
    create: "Create",
    renameTitle: "Rename",
    renamePlaceholder: "Enter new name",
    newFolderTitle: "New Folder",
    folderNamePlaceholder: "Folder name",
    changePwTitle: "Change Password",
    currentPwPlaceholder: "Current Password",
    newPwPlaceholder: "New Password",
    confirmPwPlaceholder: "Confirm New Password",
    changePwConfirm: "Update Password",

    // Toolbar & Controls
    save: "Save",
    copyUrl: "Copy Link",
    clear: "Clear",
    formatTxt: "TXT Plain",
    formatMd: "MD Render",
    previewBtn: "Preview",
    exitPreviewBtn: "Edit",
    themeToggle: "Toggle Theme",
    langSelect: "Language",
    changePassword: "Change Password",
    logout: "Log Out",
    serverInfoTitle: "JAIST Server System Info",

    // Status bar
    wordsCount: "{words} words",
    charsCount: "{chars} chars",
    linesCount: "{lines} lines",
    unsaved: "Unsaved",
    saved: "Saved",

    // File Manager
    noFiles: "No files found",
    noMatchFiles: "No matching files found",
    copyUrlSuccess: "Link copied to clipboard",
    deleteConfirm: "Are you sure you want to delete '{name}'?",
    deleteSuccess: "Deleted successfully",
    deleteFail: "Delete failed: {error}",
    uploading: "Uploading: {name}",
    uploadSuccess: "Successfully uploaded '{name}'",
    uploadFail: "Upload failed: {error}",
    mkdirSuccess: "Folder '{name}' created",
    mkdirFail: "Failed to create folder: {error}",
    renameSuccess: "Renamed successfully",
    renameFail: "Rename failed: {error}",
    rootFolder: "Root",

    // Server Info Dashboard
    serverCpu: "CPU Cores",
    serverLoad: "Load Average",
    serverArch: "Processor Architecture",
    serverRamTotal: "Total Memory (RAM)",
    serverRamFree: "Available Memory",
    serverProc: "Active Processes",
    serverOs: "OS & Kernel",
    serverHostname: "Hostname",
    serverUptime: "Uptime",
    serverPerl: "Perl Environment",

    // Lightbox & Archive
    close: "Close",
    prev: "Previous",
    next: "Next",
    archiveUnpacking: "Unpacking archive...",
    archiveEmpty: "Archive is empty",
    archiveError: "Failed to unpack archive"
  }
};

let currentLang = localStorage.getItem('app_lang') || 'zh';

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    updateUI();
  }
}

export function t(key, params = {}) {
  const langObj = translations[currentLang] || translations.zh;
  let text = langObj[key] || translations.zh[key] || key;

  Object.keys(params).forEach(p => {
    text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
  });

  return text;
}

export function updateUI() {
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

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.value = currentLang;
  }
}
