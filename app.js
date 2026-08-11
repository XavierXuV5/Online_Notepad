/* ============================================================
   Online Notepad — Application Logic
   ============================================================ */

const API_AUTH  = '../cgi-bin/auth.pl';
const API_NOTES = '../cgi-bin/notes.pl';
const API_UPLOAD = '../cgi-bin/upload.pl';

// ---- Application State ----
const state = {
  notes: [],
  activeNote: null,     // { name, format }
  savedContent: '',
  savedTitle: '',
  autosaveTimer: null,
  viewMode: 'edit',     // 'edit' | 'split' | 'preview'
  renameTarget: null,
  files: [],
};

// ---- DOM Cache ----
const dom = {
  // Lock screen
  overlay:       document.getElementById('overlay'),
  lockCard:      document.getElementById('lock-card'),
  passwordForm:  document.getElementById('password-form'),
  passwordInput: document.getElementById('password-input'),
  authError:     document.getElementById('auth-error'),
  // App shell
  app:           document.getElementById('app'),
  sidebar:       document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  mobileSidebarBtn: document.getElementById('mobile-sidebar-btn'),
  sidebarBackdrop: document.getElementById('sidebar-backdrop'),
  // Sidebar tabs
  panelNotes:    document.getElementById('panel-notes'),
  panelFiles:    document.getElementById('panel-files'),
  notesList:     document.getElementById('notes-list'),
  filesList:     document.getElementById('files-list'),
  // Note actions
  newNoteBtn:    document.getElementById('new-note-btn'),
  // File upload
  uploadBtnLabel: document.getElementById('upload-btn-label'),
  fileUploadInput: document.getElementById('file-upload-input'),
  dropZone:      document.getElementById('drop-zone'),
  // Editor
  noteTitle:     document.getElementById('note-title'),
  saveIndicator: document.getElementById('save-indicator'),
  editorContainer: document.getElementById('editor-container'),
  editor:        document.getElementById('editor'),
  preview:       document.getElementById('preview'),
  splitDivider:  document.getElementById('split-divider'),
  // Toolbar
  mdTools:       document.getElementById('md-tools'),
  viewModeBtn:   document.getElementById('view-mode-btn'),
  viewModeText:  document.getElementById('view-mode-text'),
  saveBtn:       document.getElementById('save-btn'),
  // Status bar
  wordCount:     document.getElementById('word-count'),
  charCount:     document.getElementById('char-count'),
  lineCount:     document.getElementById('line-count'),
  currentFormat: document.getElementById('current-format'),
  // Modals
  newNoteModal:    document.getElementById('new-note-modal'),
  newNoteName:     document.getElementById('new-note-name'),
  newNoteCancel:   document.getElementById('new-note-cancel'),
  newNoteConfirm:  document.getElementById('new-note-confirm'),
  renameModal:     document.getElementById('rename-modal'),
  renameInput:     document.getElementById('rename-input'),
  renameCancel:    document.getElementById('rename-cancel'),
  renameConfirm:   document.getElementById('rename-confirm'),
  changePwModal:   document.getElementById('change-pw-modal'),
  currentPw:       document.getElementById('current-pw'),
  newPw:           document.getElementById('new-pw'),
  confirmPw:       document.getElementById('confirm-pw'),
  pwChangeError:   document.getElementById('pw-change-error'),
  changePwCancel:  document.getElementById('change-pw-cancel'),
  changePwConfirm: document.getElementById('change-pw-confirm'),
  changePwBtn:     document.getElementById('change-password-btn'),
  logoutBtn:       document.getElementById('logout-btn'),
  // Toast
  toast:           document.getElementById('toast'),
  // Lightbox
  lightbox:        document.getElementById('image-lightbox'),
  lightboxImg:     document.getElementById('lightbox-img'),
  lightboxVideo:   document.getElementById('lightbox-video'),
  lightboxIframe:  document.getElementById('lightbox-iframe'),
  lightboxZip:     document.getElementById('lightbox-zip'),
  lightboxFilename: document.getElementById('lightbox-filename'),
  lightboxClose:   document.getElementById('lightbox-close'),
  lightboxPrev:    document.getElementById('lightbox-prev'),
  lightboxNext:    document.getElementById('lightbox-next'),
};

// ---- Utilities ----
const cp1252Map = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC,
  0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};
const unicodeToByteMap = {};
for (let b = 0; b < 256; b++) unicodeToByteMap[b] = b;
Object.keys(cp1252Map).forEach(function(b) { unicodeToByteMap[cp1252Map[b]] = parseInt(b, 10); });

function fixEncoding(str) {
  if (!str) return str;
  if (/[\u4e00-\u9fa5\u3040-\u30ff]/.test(str)) return str;

  try {
    const bytes = new Uint8Array(str.length);
    let valid = true;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (unicodeToByteMap[code] !== undefined) {
        bytes[i] = unicodeToByteMap[code];
      } else if (code <= 255) {
        bytes[i] = code;
      } else {
        valid = false;
        break;
      }
    }

    if (valid) {
      try {
        const decodedUtf8 = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        if (/[\u4e00-\u9fa5\u3040-\u30ff]/.test(decodedUtf8)) return decodedUtf8;
      } catch (e) {}

      try {
        const decodedGbk = new TextDecoder('gbk').decode(bytes);
        if (/[\u4e00-\u9fa5]/.test(decodedGbk)) return decodedGbk;
      } catch (e) {}
    }
  } catch (e) {}

  return str;
}

function getFilePreviewType(filename) {
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(filename)) return 'image';
  if (/\.(mp4|webm|ogg|mov)$/i.test(filename)) return 'video';
  if (/\.(pdf)$/i.test(filename)) return 'pdf';
  if (/\.(ppt|pptx|doc|docx|xls|xlsx)$/i.test(filename)) return 'office';
  if (/\.(zip|jar|epub|7z|rar|tar|gz|bz2|xz)$/i.test(filename)) return 'zip';
  return null;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function sanitizeName(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

async function postToApi(url, data) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, v);
  }
  const res = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
  return res.json();
}

function showToast(msg, duration) {
  duration = duration || 2500;
  dom.toast.textContent = msg;
  dom.toast.classList.remove('hidden');
  dom.toast.classList.add('show');
  setTimeout(function() {
    dom.toast.classList.remove('show');
    setTimeout(function() { dom.toast.classList.add('hidden'); }, 250);
  }, duration);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ---- Authentication ----
async function checkAuth() {
  try {
    const data = await postToApi(API_AUTH, { action: 'check' });
    if (data.authenticated) {
      showApp();
    }
  } catch (e) { /* not authenticated */ }
}

dom.passwordForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  dom.authError.classList.add('hidden');
  const pw = dom.passwordInput.value;
  if (!pw) return;
  try {
    const data = await postToApi(API_AUTH, { action: 'login', password: pw });
    if (data.success) {
      showApp();
    } else {
      dom.authError.classList.remove('hidden');
      dom.passwordInput.value = '';
      dom.passwordInput.focus();
    }
  } catch (err) {
    dom.authError.textContent = '接続エラーが発生しました';
    dom.authError.classList.remove('hidden');
  }
});

function showApp() {
  dom.overlay.classList.remove('active');
  dom.app.classList.remove('hidden');
  loadNotes();
  loadFiles();
}

dom.logoutBtn.addEventListener('click', async function() {
  await postToApi(API_AUTH, { action: 'logout' });
  location.reload();
});

// ---- Note List ----
// notes.pl returns: {name: "display name", ext: "txt|md", filename: "actual_file.txt"}
// We map: filename→server file, name→display title, ext→format
async function loadNotes() {
  try {
    const data = await postToApi(API_NOTES, { action: 'list' });
    state.notes = (data.notes || []).map(function(n) {
      return { filename: n.filename, title: n.name, format: n.ext };
    });
    renderNotesList();
  } catch (e) {
    showToast('メモ一覧の取得に失敗しました');
  }
}

function renderNotesList() {
  dom.notesList.innerHTML = '';
  if (state.notes.length === 0) {
    dom.notesList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">メモがありません</p>';
    return;
  }
  state.notes.forEach(function(note) {
    var el = document.createElement('div');
    el.className = 'note-item' + (state.activeNote && state.activeNote.filename === note.filename ? ' active' : '');
    el.innerHTML =
      '<svg class="note-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
      '<span class="note-name">' + escapeHtml(note.title) + '</span>' +
      '<span class="note-ext">' + escapeHtml(note.format) + '</span>';
    el.addEventListener('click', function() { openNote(note); });
    el.addEventListener('contextmenu', function(e) { showContextMenu(e, note); });
    dom.notesList.appendChild(el);
  });
}

// ---- Open Note ----
async function openNote(note) {
  hideServerDashboard();

  // Save current note if unsaved
  if (state.activeNote && hasUnsavedChanges()) {
    await saveNote(false);
  }

  try {
    const data = await postToApi(API_NOTES, { action: 'read', filename: note.filename });
    if (data.error) {
      showToast('メモの読み込みに失敗: ' + data.error);
      return;
    }

    state.activeNote = note;
    state.savedContent = data.content || '';
    state.savedTitle = note.title;

    dom.editor.value = state.savedContent;
    dom.noteTitle.value = note.title;
    dom.currentFormat.textContent = note.format.toUpperCase();

    // Set view mode & toolbar visibility based on format
    setViewMode('edit');
    updateFormatUI();
    updateStats();
    setSaveIndicator('saved');
    renderNotesList();
  } catch (e) {
    showToast('メモの読み込みに失敗しました');
  }
}

function updateFormatUI() {
  var isMd = state.activeNote && state.activeNote.format === 'md';
  dom.mdTools.classList.toggle('hidden', !isMd || state.viewMode === 'preview');
  dom.viewModeBtn.classList.toggle('hidden', !isMd);
}

// ---- View Mode Management ----
var viewModes = ['edit', 'split', 'preview'];
var viewModeLabels = { edit: '編集', split: '分割', preview: 'プレビュー' };

function setViewMode(mode) {
  state.viewMode = mode;
  dom.editorContainer.setAttribute('data-view', mode);
  dom.viewModeText.textContent = viewModeLabels[mode];

  // Show/hide MD tools (hide in preview mode)
  var isMd = state.activeNote && state.activeNote.format === 'md';
  dom.mdTools.classList.toggle('hidden', !isMd || mode === 'preview');

  // Render preview in split & preview modes
  if (mode === 'split' || mode === 'preview') {
    renderMarkdown(dom.editor.value);
  }
}

dom.viewModeBtn.addEventListener('click', function() {
  var idx = viewModes.indexOf(state.viewMode);
  var next = viewModes[(idx + 1) % viewModes.length];
  setViewMode(next);
});

// ---- Markdown Rendering ----
function renderMarkdown(rawText) {
  if (typeof marked !== 'undefined' && marked.parse) {
    dom.preview.innerHTML = marked.parse(rawText || '');
  } else {
    // Fallback parser
    var html = escapeHtml(rawText || '');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    dom.preview.innerHTML = html;
  }
}

// ---- Save Note ----
async function saveNote(showFeedback) {
  if (!state.activeNote) return;

  var content = dom.editor.value;
  var title = sanitizeName(dom.noteTitle.value) || state.activeNote.title;
  var filename = state.activeNote.filename;

  setSaveIndicator('saving');

  try {
    // If title changed, rename first
    if (title !== state.savedTitle) {
      var newFilename = title + '.' + state.activeNote.format;
      var renameData = await postToApi(API_NOTES, { action: 'rename', filename: filename, new_filename: newFilename });
      if (renameData.error) {
        showToast('名前変更失敗: ' + renameData.error);
        setSaveIndicator('unsaved');
        return;
      }
      state.activeNote.filename = newFilename;
      state.activeNote.title = title;
      state.savedTitle = title;
      filename = newFilename;
    }

    var saveData = await postToApi(API_NOTES, { action: 'save', filename: filename, content: content });
    if (saveData.error) {
      showToast('保存失敗: ' + saveData.error);
      setSaveIndicator('unsaved');
      return;
    }

    state.savedContent = content;
    setSaveIndicator('saved');
    if (showFeedback !== false) {
      showToast('保存しました');
    }
    loadNotes();
  } catch (e) {
    showToast('保存に失敗しました');
    setSaveIndicator('unsaved');
  }
}

function setSaveIndicator(status) {
  var labels = { saved: '保存済み', saving: '保存中…', unsaved: '未保存' };
  dom.saveIndicator.textContent = labels[status] || '';
  dom.saveIndicator.setAttribute('data-status', status);
}

function hasUnsavedChanges() {
  if (!state.activeNote) return false;
  return dom.editor.value !== state.savedContent;
}

// ---- Editor Events ----
dom.editor.addEventListener('input', function() {
  setSaveIndicator('unsaved');
  updateStats();
  clearTimeout(state.autosaveTimer);
  state.autosaveTimer = setTimeout(function() { saveNote(false); }, 1000);

  // Live preview update in split mode
  if (state.viewMode === 'split') {
    renderMarkdown(dom.editor.value);
  }
});

dom.editor.addEventListener('keydown', function(e) {
  // Tab → 2 spaces
  if (e.key === 'Tab') {
    e.preventDefault();
    var start = dom.editor.selectionStart;
    var end = dom.editor.selectionEnd;
    dom.editor.value = dom.editor.value.substring(0, start) + '  ' + dom.editor.value.substring(end);
    dom.editor.selectionStart = dom.editor.selectionEnd = start + 2;
    dom.editor.dispatchEvent(new Event('input'));
  }
  // Ctrl+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveNote(true);
  }
});

dom.saveBtn.addEventListener('click', function() { saveNote(true); });

// ---- Stats ----
function updateStats() {
  var text = dom.editor.value;
  var words = text.trim() ? text.trim().split(/\s+/).length : 0;
  var chars = text.length;
  var lines = text.split('\n').length;
  dom.wordCount.textContent = words + ' 語';
  dom.charCount.textContent = chars + ' 文字';
  dom.lineCount.textContent = lines + ' 行';
}

// ---- Markdown Toolbar Shortcuts ----
function insertMarkdown(prefix, suffix) {
  if (state.viewMode === 'preview') return;
  var start = dom.editor.selectionStart;
  var end = dom.editor.selectionEnd;
  var text = dom.editor.value;
  var selected = text.substring(start, end);
  var before = text.substring(0, start);
  var after = text.substring(end);
  dom.editor.value = before + prefix + selected + suffix + after;
  dom.editor.selectionStart = start + prefix.length;
  dom.editor.selectionEnd = end + prefix.length;
  dom.editor.focus();
  dom.editor.dispatchEvent(new Event('input'));
}

document.getElementById('md-bold').addEventListener('click', function() { insertMarkdown('**', '**'); });
document.getElementById('md-italic').addEventListener('click', function() { insertMarkdown('*', '*'); });
document.getElementById('md-heading').addEventListener('click', function() { insertMarkdown('## ', ''); });
document.getElementById('md-list').addEventListener('click', function() { insertMarkdown('- ', ''); });
document.getElementById('md-quote').addEventListener('click', function() { insertMarkdown('> ', ''); });
document.getElementById('md-code').addEventListener('click', function() { insertMarkdown('```\n', '\n```'); });

// ---- New Note Modal ----
dom.newNoteBtn.addEventListener('click', function() {
  dom.newNoteName.value = '';
  dom.newNoteModal.classList.remove('hidden');
  dom.newNoteName.focus();
});
dom.newNoteCancel.addEventListener('click', function() { dom.newNoteModal.classList.add('hidden'); });

dom.newNoteConfirm.addEventListener('click', async function() {
  var name = sanitizeName(dom.newNoteName.value);
  if (!name) { showToast('メモ名を入力してください'); return; }

  var fmtRadio = document.querySelector('input[name="new-note-fmt"]:checked');
  var fmt = fmtRadio ? fmtRadio.value : 'txt';
  var fn = name + '.' + fmt;

  try {
    var data = await postToApi(API_NOTES, { action: 'save', filename: fn, content: '' });
    if (data.error) {
      showToast('作成失敗: ' + data.error);
      return;
    }
    dom.newNoteModal.classList.add('hidden');
    showToast('「' + name + '」を作成しました');
    await loadNotes();
    openNote({ filename: fn, title: name, format: fmt });
  } catch (e) {
    showToast('メモの作成に失敗しました');
  }
});

// ---- Sidebar Toggle ----
function toggleSidebar() {
  var isMobile = window.innerWidth <= 700;
  if (isMobile) {
    var isMobileOpen = dom.sidebar.classList.contains('mobile-open');
    if (isMobileOpen) {
      dom.sidebar.classList.remove('mobile-open');
      dom.sidebarBackdrop.classList.remove('show');
    } else {
      dom.sidebar.classList.add('mobile-open');
      dom.sidebarBackdrop.classList.add('show');
    }
  } else {
    // Desktop: toggle collapsed state, ensure mobile backdrop is NEVER shown
    dom.sidebar.classList.toggle('collapsed');
    dom.sidebar.classList.remove('mobile-open');
    dom.sidebarBackdrop.classList.remove('show');
  }
}

if (dom.sidebarToggle) dom.sidebarToggle.addEventListener('click', toggleSidebar);
if (dom.mobileSidebarBtn) dom.mobileSidebarBtn.addEventListener('click', toggleSidebar);

dom.sidebarBackdrop.addEventListener('click', function() {
  dom.sidebar.classList.remove('mobile-open');
  dom.sidebarBackdrop.classList.remove('show');
});

// ---- Sidebar Tab Switching ----
document.querySelectorAll('.sidebar-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.sidebar-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.sidebar-panel').forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    var tabName = tab.getAttribute('data-tab');
    var panel = document.getElementById('panel-' + tabName);
    if (panel) panel.classList.add('active');

    if (tabName === 'files') {
      showServerDashboard();
    } else if (tabName === 'notes') {
      hideServerDashboard();
    }
  });
});

// ---- Context Menu ----
var activeContextMenu = null;

function showContextMenu(e, note) {
  e.preventDefault();
  removeContextMenu();

  var menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';

  var renameBtn = document.createElement('button');
  renameBtn.className = 'context-menu-item';
  renameBtn.textContent = '名前を変更';
  renameBtn.addEventListener('click', function() {
    removeContextMenu();
    state.renameTarget = note;
    dom.renameInput.value = note.title;
    dom.renameModal.classList.remove('hidden');
    dom.renameInput.focus();
    dom.renameInput.select();
  });

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'context-menu-item danger';
  deleteBtn.textContent = '削除';
  deleteBtn.addEventListener('click', function() {
    removeContextMenu();
    deleteNote(note);
  });

  menu.appendChild(renameBtn);
  menu.appendChild(deleteBtn);
  document.body.appendChild(menu);
  activeContextMenu = menu;

  // Adjust if overflowing
  var rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';
}

function removeContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

document.addEventListener('click', removeContextMenu);

// ---- Rename Modal ----
dom.renameCancel.addEventListener('click', function() {
  dom.renameModal.classList.add('hidden');
  state.renameTarget = null;
});

dom.renameConfirm.addEventListener('click', async function() {
  if (!state.renameTarget) return;
  var newTitle = sanitizeName(dom.renameInput.value);
  if (!newTitle) { showToast('名前を入力してください'); return; }

  var oldFilename = state.renameTarget.filename;
  var newFilename = newTitle + '.' + state.renameTarget.format;

  try {
    var data = await postToApi(API_NOTES, { action: 'rename', filename: oldFilename, new_filename: newFilename });
    if (data.error) {
      showToast('名前変更失敗: ' + data.error);
      return;
    }

    // Update active note if it was renamed
    if (state.activeNote && state.activeNote.filename === oldFilename) {
      state.activeNote.filename = newFilename;
      state.activeNote.title = newTitle;
      state.savedTitle = newTitle;
      dom.noteTitle.value = newTitle;
    }

    dom.renameModal.classList.add('hidden');
    state.renameTarget = null;
    showToast('名前を変更しました');
    loadNotes();
  } catch (e) {
    showToast('名前の変更に失敗しました');
  }
});

// ---- Delete Note ----
async function deleteNote(note) {
  if (!confirm('「' + note.title + '」を削除しますか？')) return;

  try {
    var data = await postToApi(API_NOTES, { action: 'delete', filename: note.filename });
    if (data.error) {
      showToast('削除失敗: ' + data.error);
      return;
    }

    if (state.activeNote && state.activeNote.filename === note.filename) {
      state.activeNote = null;
      state.savedContent = '';
      state.savedTitle = '';
      dom.editor.value = '';
      dom.noteTitle.value = '';
      dom.currentFormat.textContent = '';
      setViewMode('edit');
      dom.mdTools.classList.add('hidden');
      dom.viewModeBtn.classList.add('hidden');
    }

    showToast('「' + note.title + '」を削除しました');
    loadNotes();
  } catch (e) {
    showToast('削除に失敗しました');
  }
}

// ---- Password Change ----
dom.changePwBtn.addEventListener('click', function() {
  dom.currentPw.value = '';
  dom.newPw.value = '';
  dom.confirmPw.value = '';
  dom.pwChangeError.classList.add('hidden');
  dom.changePwModal.classList.remove('hidden');
  dom.currentPw.focus();
});

dom.changePwCancel.addEventListener('click', function() {
  dom.changePwModal.classList.add('hidden');
});

dom.changePwConfirm.addEventListener('click', async function() {
  var currPw = dom.currentPw.value;
  var newPw = dom.newPw.value;
  var confirmPw = dom.confirmPw.value;

  if (!currPw || !newPw) {
    dom.pwChangeError.textContent = 'すべてのフィールドを入力してください';
    dom.pwChangeError.classList.remove('hidden');
    return;
  }
  if (newPw !== confirmPw) {
    dom.pwChangeError.textContent = '新しいパスワードが一致しません';
    dom.pwChangeError.classList.remove('hidden');
    return;
  }
  if (newPw.length < 4) {
    dom.pwChangeError.textContent = 'パスワードは4文字以上にしてください';
    dom.pwChangeError.classList.remove('hidden');
    return;
  }

  try {
    var data = await postToApi(API_AUTH, {
      action: 'change_password',
      current_password: currPw,
      new_password: newPw,
    });
    if (data.success) {
      dom.changePwModal.classList.add('hidden');
      showToast('パスワードを変更しました');
    } else {
      dom.pwChangeError.textContent = data.error || 'パスワード変更に失敗しました';
      dom.pwChangeError.classList.remove('hidden');
    }
  } catch (e) {
    dom.pwChangeError.textContent = '接続エラーが発生しました';
    dom.pwChangeError.classList.remove('hidden');
  }
});

// ---- Unsaved Changes Warning ----
window.addEventListener('beforeunload', function(e) {
  if (hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ============================================================
//  SERVER DASHBOARD & FILE UPLOAD
// ============================================================

function showServerDashboard() {
  var dash = document.getElementById('server-dashboard');
  if (dash) dash.classList.remove('hidden');
  dom.editorContainer.classList.add('hidden');
  dom.noteTitle.value = 'JAIST サーバーシステム情報';
  dom.noteTitle.disabled = true;
  dom.mdTools.classList.add('hidden');
  dom.viewModeBtn.classList.add('hidden');
  dom.saveBtn.classList.add('hidden');
  dom.saveIndicator.classList.add('hidden');

  var statusBar = document.querySelector('.status-bar');
  if (statusBar) statusBar.classList.add('hidden');

  loadFiles();
}

function hideServerDashboard() {
  var dash = document.getElementById('server-dashboard');
  if (dash) dash.classList.add('hidden');
  dom.editorContainer.classList.remove('hidden');
  dom.noteTitle.disabled = false;
  dom.saveBtn.classList.remove('hidden');
  dom.saveIndicator.classList.remove('hidden');

  var statusBar = document.querySelector('.status-bar');
  if (statusBar) statusBar.classList.remove('hidden');

  if (state.activeNote) {
    dom.noteTitle.value = state.activeNote.title;
  } else {
    dom.noteTitle.value = '';
  }
}

var serverEntry = document.getElementById('server-info-entry');
if (serverEntry) {
  serverEntry.addEventListener('click', showServerDashboard);
}

async function loadFiles() {
  try {
    var data = await postToApi(API_UPLOAD, { action: 'list' });
    state.files = data.files || [];
    if (data.server) {
      var cpu      = document.getElementById('server-cpu');
      var load     = document.getElementById('server-load');
      var arch     = document.getElementById('server-arch');
      var proc     = document.getElementById('server-proc');
      var ramTotal = document.getElementById('server-ram-total');
      var ramFree  = document.getElementById('server-ram-free');
      var os       = document.getElementById('server-os');
      var hostname = document.getElementById('server-hostname');
      var uptime   = document.getElementById('server-uptime');
      var perl     = document.getElementById('server-perl');

      var stTotal  = document.getElementById('storage-total');
      var stUsed   = document.getElementById('storage-used');
      var stFree   = document.getElementById('storage-free');
      var stBadge  = document.getElementById('storage-pct-badge');
      var stFill   = document.getElementById('storage-bar-fill');

      if (cpu)      cpu.textContent      = data.server.cpu_info || 'N/A';
      if (load)     load.textContent     = data.server.load_avg || 'N/A';
      if (arch)     arch.textContent     = data.server.arch || 'N/A';
      if (proc)     proc.textContent     = data.server.processes || 'N/A';
      if (ramTotal) ramTotal.textContent = data.server.total_mem || 'N/A';
      if (ramFree)  ramFree.textContent  = data.server.free_mem || 'N/A';
      if (os)       os.textContent       = data.server.os || 'N/A';
      if (hostname) hostname.textContent = data.server.hostname || 'N/A';
      if (uptime)   uptime.textContent   = data.server.uptime || 'N/A';
      if (perl)     perl.textContent     = data.server.perl_ver || 'N/A';

      if (stTotal) stTotal.textContent = data.server.disk_total || 'N/A';
      if (stUsed)  stUsed.textContent  = data.server.disk_used || 'N/A';
      if (stFree)  stFree.textContent  = data.server.disk_free || 'N/A';
      var pct = data.server.disk_pct || 0;
      if (stBadge) stBadge.textContent = pct + '% 使用中';
      if (stFill)  stFill.style.width  = Math.min(100, Math.max(0, pct)) + '%';
    }
    renderFilesList();
  } catch (e) {
    // silently fail
  }
}

function renderFilesList() {
  dom.filesList.innerHTML = '';

  if (state.files.length === 0) {
    dom.filesList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">ファイルがありません</p>';
    return;
  }

  state.files.forEach(function(f) {
    var item = document.createElement('div');
    item.className = 'file-item';

    var displayName = fixEncoding(f.name);
    var previewType = getFilePreviewType(displayName);
    var canPreview = !!previewType;
    var thumbHtml;

    if (previewType === 'image') {
      thumbHtml = '<div class="file-thumb file-thumb-preview"><img src="uploads/' + encodeURIComponent(f.name) + '" alt="" loading="lazy" /></div>';
    } else {
      var ext = displayName.split('.').pop().toUpperCase().substring(0, 4);
      thumbHtml = '<div class="file-thumb' + (canPreview ? ' file-thumb-preview' : '') + '">' + escapeHtml(ext) + '</div>';
    }

    item.innerHTML = thumbHtml +
      '<div class="file-info' + (canPreview ? ' file-info-preview' : '') + '">' +
        '<div class="file-name" title="' + escapeHtml(displayName) + '">' + escapeHtml(displayName) + '</div>' +
        '<div class="file-size">' + formatFileSize(f.size) + '</div>' +
      '</div>' +
      '<div class="file-actions">' +
        '<button class="file-action-btn copy" title="URLをコピー">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '</button>' +
        '<button class="file-action-btn delete" title="削除">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
        '</button>' +
      '</div>';

    // Preview click handler (on thumbnail and file-info)
    if (canPreview) {
      var thumbEl = item.querySelector('.file-thumb-preview');
      var infoEl = item.querySelector('.file-info-preview');
      var openPreview = function(e) {
        e.stopPropagation();
        openLightbox(f.name);
      };
      if (thumbEl) thumbEl.addEventListener('click', openPreview);
      if (infoEl) infoEl.addEventListener('click', openPreview);
    }

    // Copy URL handler
    item.querySelector('.copy').addEventListener('click', function(e) {
      e.stopPropagation();
      var url = location.origin + location.pathname.replace(/\/[^/]*$/, '/uploads/') + encodeURIComponent(f.name);
      copyToClipboard(url);
      showToast('URLをコピーしました');
    });

    // Delete handler
    item.querySelector('.delete').addEventListener('click', function(e) {
      e.stopPropagation();
      deleteFile(f.name);
    });

    dom.filesList.appendChild(item);
  });
}

async function uploadFiles(fileList) {
  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    showToast('アップロード中: ' + file.name);

    var fd = new FormData();
    fd.append('action', 'upload');
    fd.append('file', file, file.name);

    try {
      var res = await fetch(API_UPLOAD, { method: 'POST', body: fd, credentials: 'same-origin' });
      var data = await res.json();
      if (data.error) {
        showToast('失敗: ' + data.error);
      } else {
        showToast('「' + data.name + '」をアップロードしました');
      }
    } catch (e) {
      showToast('アップロードに失敗しました');
    }
  }
  loadFiles();
}

async function deleteFile(filename) {
  if (!confirm('「' + filename + '」を削除しますか？')) return;
  try {
    var data = await postToApi(API_UPLOAD, { action: 'delete', filename: filename });
    if (data.error) {
      showToast('削除失敗: ' + data.error);
    } else {
      showToast('削除しました');
      loadFiles();
    }
  } catch (e) {
    showToast('削除に失敗しました');
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// File input handler
dom.fileUploadInput.addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    uploadFiles(e.target.files);
    e.target.value = '';
  }
});

// Drag & drop handlers
var dragCounter = 0;

document.addEventListener('dragenter', function(e) {
  e.preventDefault();
  dragCounter++;
  dom.dropZone.classList.add('active');
});

document.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dom.dropZone.classList.remove('active');
  }
});

document.addEventListener('dragover', function(e) { e.preventDefault(); });

document.addEventListener('drop', function(e) {
  e.preventDefault();
  dragCounter = 0;
  dom.dropZone.classList.remove('active');
  if (e.dataTransfer.files.length > 0) {
    // Switch to files tab automatically
    document.querySelectorAll('.sidebar-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.sidebar-panel').forEach(function(p) { p.classList.remove('active'); });
    var filesTab = document.querySelector('.sidebar-tab[data-tab="files"]');
    if (filesTab) filesTab.classList.add('active');
    dom.panelFiles.classList.add('active');

    uploadFiles(e.dataTransfer.files);
  }
});

// ============================================================
//  FILE PREVIEW LIGHTBOX
// ============================================================

function getPreviewableFiles() {
  return state.files.filter(function(f) {
    return getFilePreviewType(f.name) !== null;
  });
}

function getFileUrl(filename) {
  return location.origin + location.pathname.replace(/\/[^/]*$/, '/uploads/') + encodeURIComponent(filename);
}

function openLightbox(filename) {
  var files = getPreviewableFiles();
  var idx = -1;
  for (var i = 0; i < files.length; i++) {
    if (files[i].name === filename) { idx = i; break; }
  }
  if (idx === -1) return;

  state.lightboxIndex = idx;
  state.lightboxFiles = files;
  showLightboxFile(idx);
  dom.lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function hideLightboxContent() {
  // Pause and reset video
  dom.lightboxVideo.pause();
  dom.lightboxVideo.removeAttribute('src');
  dom.lightboxVideo.load();
  // Clear iframe
  dom.lightboxIframe.src = 'about:blank';
  // Clear image
  dom.lightboxImg.src = '';
  // Clear zip
  if (dom.lightboxZip) dom.lightboxZip.innerHTML = '';
  // Hide all
  dom.lightboxImg.classList.add('hidden');
  dom.lightboxVideo.classList.add('hidden');
  dom.lightboxIframe.classList.add('hidden');
  if (dom.lightboxZip) dom.lightboxZip.classList.add('hidden');
}

function showLightboxFile(idx) {
  var files = state.lightboxFiles;
  var f = files[idx];
  var type = getFilePreviewType(f.name);
  var fileUrl = 'uploads/' + encodeURIComponent(f.name);
  var fullUrl = getFileUrl(f.name);

  hideLightboxContent();
  state.lightboxIndex = idx;
  dom.lightboxFilename.textContent = f.name;

  if (type === 'image') {
    dom.lightboxImg.src = fileUrl;
    dom.lightboxImg.alt = f.name;
    dom.lightboxImg.classList.remove('hidden');
  } else if (type === 'video') {
    dom.lightboxVideo.src = fileUrl;
    dom.lightboxVideo.classList.remove('hidden');
  } else if (type === 'pdf') {
    dom.lightboxIframe.src = fileUrl;
    dom.lightboxIframe.classList.remove('hidden');
  } else if (type === 'office') {
    // Use Microsoft Office Online Viewer for public files
    var viewerUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(fullUrl);
    dom.lightboxIframe.src = viewerUrl;
    dom.lightboxIframe.classList.remove('hidden');
  } else if (type === 'zip') {
    dom.lightboxZip.classList.remove('hidden');
    dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">ZIP アーカイブ解凍中…</div>';
    loadZipPreview(fileUrl, f.name);
  }

  // Update nav button states
  dom.lightboxPrev.disabled = (idx <= 0);
  dom.lightboxNext.disabled = (idx >= files.length - 1);
}

function closeLightbox() {
  dom.lightbox.classList.add('hidden');
  hideLightboxContent();
  document.body.style.overflow = '';
}

function lightboxPrev() {
  if (state.lightboxIndex > 0) {
    showLightboxFile(state.lightboxIndex - 1);
  }
}

function lightboxNext() {
  if (state.lightboxFiles && state.lightboxIndex < state.lightboxFiles.length - 1) {
    showLightboxFile(state.lightboxIndex + 1);
  }
}

// ---- Windows Explorer Style Archive Tree View ----
function getFileIcon(fileName) {
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(fileName)) return '🖼️';
  if (/\.(pdf)$/i.test(fileName)) return '📕';
  if (/\.(ppt|pptx|doc|docx|xls|xlsx)$/i.test(fileName)) return '📊';
  if (/\.(mp4|webm|ogg|mov)$/i.test(fileName)) return '🎬';
  if (/\.(txt|md|json|js|css|html|xml|log|py|c|cpp|h|java|sh|pl|php|rs|go|sql|yml|yaml|ini)$/i.test(fileName)) return '📄';
  if (/\.(zip|7z|rar|tar|gz|bz2|xz|jar|epub)$/i.test(fileName)) return '📦';
  return '📄';
}

function buildArchiveTree(flatEntries) {
  const root = { name: 'root', isDir: true, path: '', children: {} };

  flatEntries.forEach(function(entry) {
    const fixedPath = fixEncoding(entry.path || '');
    const cleanPath = fixedPath.replace(/^\/+/, '');
    if (!cleanPath) return;

    const parts = cleanPath.split('/').filter(Boolean);
    let current = root;

    parts.forEach(function(part, index) {
      const isLast = (index === parts.length - 1);
      const isDirectory = isLast ? entry.isDir : true;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isDir: isDirectory,
          path: parts.slice(0, index + 1).join('/') + (isDirectory ? '/' : ''),
          children: isDirectory ? {} : null,
          size: isLast ? (entry.size || 0) : 0,
          fileRef: isLast ? (entry.file || null) : null
        };
      } else if (isLast && !entry.isDir) {
        current.children[part].fileRef = entry.file;
        current.children[part].size = entry.size || 0;
        current.children[part].isDir = false;
      }

      current = current.children[part];
    });
  });

  return root;
}

function renderArchiveTreeHtml(node) {
  if (!node.children) return '';

  const childKeys = Object.keys(node.children);

  // Sort directories first, then files alphabetically
  childKeys.sort(function(a, b) {
    const itemA = node.children[a];
    const itemB = node.children[b];
    if (itemA.isDir !== itemB.isDir) return itemA.isDir ? -1 : 1;
    return itemA.name.localeCompare(itemB.name);
  });

  let html = '';
  childKeys.forEach(function(key) {
    const child = node.children[key];
    if (child.isDir) {
      const hasChildren = child.children && Object.keys(child.children).length > 0;
      html += '<div class="tree-folder" data-path="' + escapeHtml(child.path) + '">';
      html += '<div class="tree-row tree-folder-row">';
      html += '<span class="tree-toggle">▼</span>';
      html += '<span class="tree-icon tree-folder-icon"></span>';
      html += '<span class="tree-name">' + escapeHtml(child.name) + '</span>';
      html += '</div>';
      if (hasChildren) {
        html += '<div class="tree-children">' + renderArchiveTreeHtml(child) + '</div>';
      }
      html += '</div>';
    } else {
      const isPreviewable = /\.(png|jpg|jpeg|gif|webp|svg|pdf|txt|md|json|js|css|html|xml|log|py|c|cpp|h|java|sh|pl|php|rs|go|sql|yml|yaml|ini)$/i.test(child.name);
      html += '<div class="tree-file" data-path="' + escapeHtml(child.path) + '">';
      html += '<div class="tree-row tree-file-row">';
      html += '<span class="tree-toggle" style="opacity:0">•</span>';
      html += '<span class="tree-icon">' + getFileIcon(child.name) + '</span>';
      html += '<span class="tree-name">' + escapeHtml(child.name) + '</span>';
      html += '<span class="tree-size">' + (child.size ? formatFileSize(child.size) : '-') + '</span>';
      if (isPreviewable) {
        html += '<span class="zip-entry-link" data-path="' + escapeHtml(child.path) + '">プレビュー</span>';
      }
      html += '</div>';
      html += '</div>';
    }
  });

  return html;
}

function attachTreeExplorerEvents(containerEl, fileNodeMap, extractHandler) {
  // Folder expand/collapse toggling
  containerEl.querySelectorAll('.tree-folder-row').forEach(function(row) {
    row.addEventListener('click', function(ev) {
      ev.stopPropagation();
      const folderEl = row.closest('.tree-folder');
      if (folderEl) {
        folderEl.classList.toggle('collapsed');
      }
    });
  });

  // Preview link click handler
  containerEl.querySelectorAll('.zip-entry-link').forEach(function(btn) {
    btn.addEventListener('click', async function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      const targetPath = btn.getAttribute('data-path');
      const itemNode = fileNodeMap[targetPath];
      if (!itemNode) return;

      const box = document.getElementById('zip-preview-box');
      if (!box) return;

      box.classList.remove('hidden');
      box.innerHTML = '<div style="color:rgba(255,255,255,0.5)">「' + escapeHtml(targetPath) + '」解凍中…</div>';

      try {
        await extractHandler(itemNode, box);
      } catch (err) {
        box.innerHTML = '<div style="color:var(--danger)">解凍エラー: ' + escapeHtml(err.message) + '</div>';
      }
    });
  });
}

function renderTreeExplorer(archiveName, flatEntries, extractHandler, badgeText) {
  const rootNode = buildArchiveTree(flatEntries);
  const fileNodeMap = {};

  function mapNodes(node) {
    if (!node.children) return;
    Object.keys(node.children).forEach(function(k) {
      const child = node.children[k];
      fileNodeMap[child.path] = child;
      if (child.isDir) mapNodes(child);
    });
  }
  mapNodes(rootNode);

  let totalSize = 0;
  let fileCount = 0;
  flatEntries.forEach(function(e) {
    if (!e.isDir) {
      totalSize += (e.size || 0);
      fileCount++;
    }
  });

  let html = '<div class="zip-header">';
  html += '<span class="zip-title">📦 ' + escapeHtml(archiveName) + (badgeText ? ' <small style="font-size:11px;color:var(--primary)">' + escapeHtml(badgeText) + '</small>' : '') + '</span>';
  html += '<span class="zip-meta">' + fileCount + ' 個のファイル (' + formatFileSize(totalSize) + ')</span>';
  html += '</div>';

  html += '<div class="tree-explorer-container">';
  html += '<div class="tree-view-root">';
  html += renderArchiveTreeHtml(rootNode);
  html += '</div>';
  html += '</div>';

  html += '<div id="zip-preview-box" class="hidden"></div>';

  dom.lightboxZip.innerHTML = html;

  attachTreeExplorerEvents(dom.lightboxZip, fileNodeMap, extractHandler);
}

async function loadZipPreview(fileUrl, zipName) {
  dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">アーカイブ解析中…</div>';

  const isZip = /\.(zip|jar|epub)$/i.test(zipName);

  // 1. For .zip files, ALWAYS run JSZip directly for max speed & 100% reliability
  if (isZip && typeof JSZip !== 'undefined') {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const flatEntries = [];
      zip.forEach(function(relativePath, zipEntry) {
        flatEntries.push({
          path: relativePath,
          isDir: zipEntry.dir,
          size: zipEntry._data ? (zipEntry._data.uncompressedSize || 0) : 0,
          file: zipEntry
        });
      });

      if (flatEntries.length === 0) {
        dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">空の ZIP アーカイブです</div>';
        return;
      }

      renderTreeExplorer(zipName, flatEntries, async function(node, box) {
        const zipEntry = node.fileRef;
        if (!zipEntry) return;

        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.name)) {
          const blob = await zipEntry.async('blob');
          const objectUrl = URL.createObjectURL(blob);
          box.className = 'zip-inner-preview';
          box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">🖼️ ' + escapeHtml(node.path) + '</div><img src="' + objectUrl + '" class="zip-inner-img" />';
        } else if (/\.(pdf)$/i.test(node.name)) {
          const rawBlob = await zipEntry.async('blob');
          const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
          const objectUrl = URL.createObjectURL(pdfBlob);
          box.className = 'zip-inner-preview';
          box.style.maxHeight = 'none';
          box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div><iframe src="' + objectUrl + '" class="zip-inner-iframe"></iframe>';
        } else {
          const text = await zipEntry.async('string');
          box.className = 'zip-inner-preview';
          box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div>' + escapeHtml(text.slice(0, 10000)) + (text.length > 10000 ? '\n\n... (一部のみ表示)' : '');
        }
      });
      return;
    } catch (err) {
      console.warn('JSZip failed, trying libarchivejs:', err);
    }
  }

  // 2. Try local libarchive module (WebAssembly) for .7z / .rar / .tar / .gz / .zip etc.
  if (typeof window.Archive !== 'undefined') {
    try {
      await loadLocalLibarchivePreview(fileUrl, zipName);
      return;
    } catch (e) {
      console.warn('Local libarchive preview failed, trying server fallback:', e);
    }
  }

  // 3. Fallback to server-side archive inspection
  try {
    const data = await postToApi(API_UPLOAD, { action: 'archive_list', filename: zipName });
    if (data && data.entries && data.entries.length > 0) {
      renderServerArchiveList(zipName, data.entries);
      return;
    }
  } catch (e) {
    // Server archive inspection failed
  }

  dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger)">アーカイブの解凍に失敗しました。<br><span style="font-size:11px;opacity:0.7">（.7z 解凍には WebAssembly 指向の libarchive.wasm ファイル支持）</span></div>';
}

async function loadLocalLibarchivePreview(fileUrl, archiveName) {
  dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">⚡ WebAssembly (libarchivejs) で .7z アーカイブ解凍中…</div>';

  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const blob = await response.blob();
  const fileObj = new File([blob], archiveName);

  const archive = await window.Archive.open(fileObj);

  // Check encryption support
  try {
    const encrypted = await archive.hasEncryptedData();
    if (encrypted) {
      const pass = prompt('🔒 暗号化された 7z アーカイブです。パスワードを入力してください:');
      if (pass) {
        await archive.usePassword(pass);
      }
    }
  } catch (e) {}

  const filesArray = await archive.getFilesArray();

  if (!filesArray || filesArray.length === 0) {
    dom.lightboxZip.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">空のアーカイブです</div>';
    return;
  }

  const flatEntries = filesArray.map(function(item) {
    const fullPath = (item.file && item.file._path) ? item.file._path : ((item.path || '') + (item.file ? item.file.name : ''));
    return {
      path: fullPath,
      isDir: !item.file,
      size: item.file ? (item.file.size || 0) : 0,
      file: item.file
    };
  });

  renderTreeExplorer(archiveName, flatEntries, async function(node, box) {
    const compressedFile = node.fileRef;
    if (!compressedFile) return;

    const extracted = await compressedFile.extract();

    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.name)) {
      const objectUrl = URL.createObjectURL(extracted);
      box.className = 'zip-inner-preview';
      box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">🖼️ ' + escapeHtml(node.path) + '</div><img src="' + objectUrl + '" class="zip-inner-img" />';
    } else if (/\.(pdf)$/i.test(node.name)) {
      const pdfBlob = new Blob([extracted], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      box.className = 'zip-inner-preview';
      box.style.maxHeight = 'none';
      box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div><iframe src="' + objectUrl + '" class="zip-inner-iframe"></iframe>';
    } else {
      const text = await extracted.text();
      box.className = 'zip-inner-preview';
      box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div>' + escapeHtml(text.slice(0, 10000)) + (text.length > 10000 ? '\n\n... (一部のみ表示)' : '');
    }
  }, '(WebAssembly 7z/Archive)');
}

function renderServerArchiveList(zipName, entries) {
  const flatEntries = entries.map(function(e) {
    return {
      path: e.name,
      isDir: e.is_dir || e.name.endsWith('/'),
      size: e.size || 0,
      file: null
    };
  });

  renderTreeExplorer(zipName, flatEntries, async function(node, box) {
    const extractUrl = API_UPLOAD + '?action=archive_extract&filename=' + encodeURIComponent(zipName) + '&inner_path=' + encodeURIComponent(node.path);

    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.name)) {
      box.className = 'zip-inner-preview';
      box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">🖼️ ' + escapeHtml(node.path) + '</div><img src="' + extractUrl + '" class="zip-inner-img" />';
    } else if (/\.(pdf)$/i.test(node.name)) {
      box.className = 'zip-inner-preview';
      box.style.maxHeight = 'none';
      box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div><iframe src="' + extractUrl + '" class="zip-inner-iframe"></iframe>';
    } else {
      try {
        const res = await fetch(extractUrl);
        const text = await res.text();
        box.className = 'zip-inner-preview';
        box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div>' + escapeHtml(text.slice(0, 10000)) + (text.length > 10000 ? '\n\n... (一部のみ表示)' : '');
      } catch (err) {
        box.innerHTML = '<div style="color:var(--danger)">プレビュー抽出エラー: ' + escapeHtml(err.message) + '</div>';
      }
    }
  }, '(Server Inspect)');
}

// Lightbox event listeners
dom.lightboxClose.addEventListener('click', closeLightbox);
dom.lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
dom.lightboxPrev.addEventListener('click', function(e) { e.stopPropagation(); lightboxPrev(); });
dom.lightboxNext.addEventListener('click', function(e) { e.stopPropagation(); lightboxNext(); });

// Keyboard navigation
document.addEventListener('keydown', function(e) {
  if (dom.lightbox.classList.contains('hidden')) return;
  if (e.key === 'Escape') { closeLightbox(); }
  else if (e.key === 'ArrowLeft') { lightboxPrev(); }
  else if (e.key === 'ArrowRight') { lightboxNext(); }
});

// ============================================================
//  THEME MANAGEMENT
// ============================================================

function initTheme() {
  var saved = localStorage.getItem('notepad_theme') || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('notepad_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
  });
}

document.querySelectorAll('.theme-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setTheme(btn.getAttribute('data-theme-val'));
  });
});

// ============================================================
//  STARTUP
// ============================================================
initTheme();
checkAuth();
