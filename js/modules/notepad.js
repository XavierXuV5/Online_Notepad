/* ============================================================
   Notepad & Markdown Editor Module
   ============================================================ */

import { postToApi, showToast, escapeHtml, sanitizeName, API_NOTES } from './api.js';
import { t } from './i18n.js';

let noteState = {
  notes: [],
  activeNote: null,
  savedContent: '',
  savedTitle: '',
  viewMode: 'edit',
  renameTarget: null,
  isTocOpen: false,
  autosaveTimer: null
};

const viewModes = ['edit', 'split', 'preview'];
const viewModeLabels = { edit: '編集', split: '分割', preview: 'プレビュー' };

export function initNotepad() {
  const editor = document.getElementById('editor');
  const noteTitle = document.getElementById('note-title');
  const saveBtn = document.getElementById('save-btn');
  const viewModeBtn = document.getElementById('view-mode-btn');

  if (editor) {
    editor.addEventListener('input', () => {
      setSaveIndicator('unsaved');
      updateStats();
      updatePreview();
      debounceLocalDraft();
    });

    editor.addEventListener('keydown', (e) => {
      // Tab -> 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
        editor.dispatchEvent(new Event('input'));
      }
      // Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNote(true);
      }
      // Ctrl+B -> Bold
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        insertMarkdown('**', '**');
      }
      // Ctrl+I -> Italic
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        insertMarkdown('*', '*');
      }
      // Ctrl+K -> Link
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        insertMarkdown('[', '](url)');
      }
      // Ctrl+Shift+P -> Toggle View Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const idx = viewModes.indexOf(noteState.viewMode);
        const next = viewModes[(idx + 1) % viewModes.length];
        setViewMode(next);
      }
    });
  }

  if (noteTitle) {
    noteTitle.addEventListener('input', () => {
      setSaveIndicator('unsaved');
    });
  }

  if (saveBtn) saveBtn.addEventListener('click', () => saveNote(true));

  if (viewModeBtn) {
    viewModeBtn.addEventListener('click', () => {
      const idx = viewModes.indexOf(noteState.viewMode);
      const next = viewModes[(idx + 1) % viewModes.length];
      setViewMode(next);
    });
  }

  initMarkdownToolbar();
  initTocOutline();
}

export async function loadNotes() {
  try {
    const data = await postToApi(API_NOTES, { action: 'list' });
    if (data.error) {
      if (data.error === 'unauthorized') {
        const overlay = document.getElementById('overlay');
        const app = document.getElementById('app');
        if (overlay) overlay.classList.add('active');
        if (app) app.classList.add('hidden');
        return;
      }
      showToast('メモ一覧の取得に失敗: ' + data.error);
      return;
    }

    noteState.notes = (data.notes || []).map(n => ({
      filename: n.filename,
      title: n.title || n.name || n.filename,
      name: n.name || n.title || n.filename,
      format: n.format || n.ext || 'txt',
      mtime: n.mtime || 0
    }));

    renderNotesList();

    if (noteState.notes.length > 0 && !noteState.activeNote) {
      openNote(noteState.notes[0]);
    }
  } catch (e) {
    // Fail silently when unauthorized or network error
  }
}

export function renderNotesList() {
  const container = document.getElementById('notes-list');
  if (!container) return;

  container.innerHTML = '';

  if (noteState.notes.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">メモがありません</p>';
    return;
  }

  noteState.notes.forEach(note => {
    const el = document.createElement('div');
    el.className = 'note-item' + (noteState.activeNote && noteState.activeNote.filename === note.filename ? ' active' : '');
    el.innerHTML =
      '<span class="note-icon">' + (note.format === 'md' ? '📝' : '📄') + '</span>' +
      '<div class="note-info">' +
        '<div class="note-name" title="' + escapeHtml(note.title) + '">' + escapeHtml(note.title) + '</div>' +
        '<div class="note-meta">' + note.format.toUpperCase() + ' • ' + formatTime(note.mtime) + '</div>' +
      '</div>';

    el.addEventListener('click', () => openNote(note));
    container.appendChild(el);
  });
}

export async function openNote(note) {
  if (noteState.activeNote && hasUnsavedChanges()) {
    await saveNote(false);
  }

  try {
    const data = await postToApi(API_NOTES, { action: 'read', filename: note.filename });
    if (data.error) {
      showToast('メモの読み込みに失敗: ' + data.error);
      return;
    }

    noteState.activeNote = note;
    noteState.savedContent = data.content || '';
    noteState.savedTitle = note.title;

    const editor = document.getElementById('editor');
    const titleInput = document.getElementById('note-title');
    const formatBadge = document.getElementById('current-format');

    if (editor) editor.value = noteState.savedContent;
    if (titleInput) titleInput.value = note.title;
    if (formatBadge) formatBadge.textContent = note.format.toUpperCase();

    setViewMode(note.format === 'md' ? 'split' : 'edit');

    const mdTools = document.getElementById('md-tools');
    const viewBtn = document.getElementById('view-mode-btn');
    if (mdTools) mdTools.classList.toggle('hidden', note.format !== 'md');
    if (viewBtn) viewBtn.classList.toggle('hidden', note.format !== 'md');

    renderNotesList();
    updateStats();
    updatePreview();
    setSaveIndicator('saved');

    // Check for offline unsaved draft restoration
    checkAndRestoreDraft(note.filename);

  } catch (e) {
    showToast('メモの読み込みに失敗しました');
  }
}

export async function saveNote(showFeedback) {
  if (!noteState.activeNote) return;

  const editor = document.getElementById('editor');
  const titleInput = document.getElementById('note-title');

  const content = editor.value;
  const title = sanitizeName(titleInput.value) || noteState.activeNote.title;
  const filename = noteState.activeNote.filename;

  setSaveIndicator('saving');

  try {
    if (title !== noteState.savedTitle) {
      const parts = filename.split('.');
      const ext = parts.pop();
      const newFn = title + '.' + ext;
      const renameData = await postToApi(API_NOTES, { action: 'rename', filename: filename, new_filename: newFn });
      if (renameData.error) {
        showToast('名前変更失敗: ' + renameData.error);
        setSaveIndicator('unsaved');
        return;
      }
      noteState.activeNote.filename = newFn;
      noteState.activeNote.title = title;
      noteState.savedTitle = title;
    }

    const saveData = await postToApi(API_NOTES, { action: 'save', filename: noteState.activeNote.filename, content: content });
    if (saveData.error) {
      showToast('保存失敗: ' + saveData.error);
      setSaveIndicator('unsaved');
      return;
    }

    noteState.savedContent = content;
    setSaveIndicator('saved');
    localStorage.removeItem('notepad_draft_' + noteState.activeNote.filename);

    if (showFeedback) showToast('保存しました');
    await loadNotes();

  } catch (e) {
    setSaveIndicator('unsaved');
    if (showFeedback) showToast('保存に失敗しました');
  }
}

function hasUnsavedChanges() {
  const editor = document.getElementById('editor');
  const titleInput = document.getElementById('note-title');
  if (!editor || !titleInput) return false;
  return editor.value !== noteState.savedContent || titleInput.value !== noteState.savedTitle;
}

function setSaveIndicator(status) {
  const ind = document.getElementById('save-indicator');
  if (!ind) return;
  const labels = { saved: '保存済み', saving: '保存中…', unsaved: '未保存' };
  ind.textContent = labels[status] || status;
  ind.className = 'save-indicator ' + status;
}

function setViewMode(mode) {
  noteState.viewMode = mode;
  const container = document.getElementById('editor-container');
  const textEl = document.getElementById('view-mode-text');

  if (container) container.setAttribute('data-view', mode);
  if (textEl) textEl.textContent = viewModeLabels[mode] || mode;

  updatePreview();
}

function updatePreview() {
  const preview = document.getElementById('preview');
  const editor = document.getElementById('editor');
  if (!preview || !editor) return;

  const mode = noteState.viewMode;
  if (mode === 'split' || mode === 'preview') {
    renderMarkdown(editor.value);
  }
}

function renderMarkdown(rawText) {
  const preview = document.getElementById('preview');
  if (!preview) return;

  if (typeof marked !== 'undefined' && marked.parse) {
    preview.innerHTML = marked.parse(rawText || '');
  } else {
    let html = escapeHtml(rawText || '');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    preview.innerHTML = html;
  }

  if (noteState.isTocOpen) {
    updateTocOutline();
  }
}

function updateStats() {
  const editor = document.getElementById('editor');
  if (!editor) return;

  const text = editor.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text.split('\n').length;

  const wEl = document.getElementById('word-count');
  const cEl = document.getElementById('char-count');
  const lEl = document.getElementById('line-count');

  if (wEl) wEl.textContent = t('wordsCount', { words });
  if (cEl) cEl.textContent = t('charsCount', { chars });
  if (lEl) lEl.textContent = t('linesCount', { lines });
}

function debounceLocalDraft() {
  if (noteState.autosaveTimer) clearTimeout(noteState.autosaveTimer);
  noteState.autosaveTimer = setTimeout(() => {
    if (!noteState.activeNote) return;
    const key = 'notepad_draft_' + noteState.activeNote.filename;
    const editor = document.getElementById('editor');
    if (editor && editor.value !== noteState.savedContent) {
      localStorage.setItem(key, editor.value);
    } else {
      localStorage.removeItem(key);
    }
  }, 1000);
}

function checkAndRestoreDraft(filename) {
  const key = 'notepad_draft_' + filename;
  const draft = localStorage.getItem(key);
  if (draft && draft !== noteState.savedContent) {
    if (confirm('【下書きが検出されました】前回未保存のオフライン下書きを復元しますか？')) {
      const editor = document.getElementById('editor');
      if (editor) {
        editor.value = draft;
        setSaveIndicator('unsaved');
        updateStats();
        updatePreview();
        showToast('下書きを復元しました');
      }
    } else {
      localStorage.removeItem(key);
    }
  }
}

function insertMarkdown(prefix, suffix) {
  if (noteState.viewMode === 'preview') return;
  const editor = document.getElementById('editor');
  if (!editor) return;

  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;
  const selected = text.substring(start, end);
  const before = text.substring(0, start);
  const after = text.substring(end);

  editor.value = before + prefix + selected + suffix + after;
  editor.selectionStart = start + prefix.length;
  editor.selectionEnd = end + prefix.length;
  editor.focus();
  editor.dispatchEvent(new Event('input'));
}

function initMarkdownToolbar() {
  const b = document.getElementById('md-bold');
  const i = document.getElementById('md-italic');
  const h = document.getElementById('md-heading');
  const l = document.getElementById('md-list');
  const q = document.getElementById('md-quote');
  const c = document.getElementById('md-code');

  if (b) b.addEventListener('click', () => insertMarkdown('**', '**'));
  if (i) i.addEventListener('click', () => insertMarkdown('*', '*'));
  if (h) h.addEventListener('click', () => insertMarkdown('## ', ''));
  if (l) l.addEventListener('click', () => insertMarkdown('- ', ''));
  if (q) q.addEventListener('click', () => insertMarkdown('> ', ''));
  if (c) c.addEventListener('click', () => insertMarkdown('```\n', '\n```'));
}

function initTocOutline() {
  const toggleBtn = document.getElementById('md-toc-toggle');
  const closeBtn = document.getElementById('md-toc-close');
  const sidebar = document.getElementById('md-toc-sidebar');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      noteState.isTocOpen = !noteState.isTocOpen;
      if (sidebar) sidebar.classList.toggle('hidden', !noteState.isTocOpen);
      if (noteState.isTocOpen) {
        updateTocOutline();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      noteState.isTocOpen = false;
      if (sidebar) sidebar.classList.add('hidden');
    });
  }
}

export function updateTocOutline() {
  const preview = document.getElementById('preview');
  const list = document.getElementById('md-toc-list');
  if (!preview || !list) return;

  const headings = preview.querySelectorAll('h1, h2, h3');
  if (headings.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:12px;text-align:center">見出しがありません</div>';
    return;
  }

  let html = '';
  headings.forEach((h, idx) => {
    const id = h.id || ('toc-heading-' + idx);
    h.id = id;
    const level = h.tagName.toLowerCase();
    const text = h.textContent.trim();
    html += '<div class="md-toc-item md-toc-' + level + '" data-target-id="' + id + '" title="' + escapeHtml(text) + '">' + escapeHtml(text) + '</div>';
  });

  list.innerHTML = html;

  list.querySelectorAll('.md-toc-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target-id');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        list.querySelectorAll('.md-toc-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return (d.getMonth() + 1) + '/' + d.getDate();
}
