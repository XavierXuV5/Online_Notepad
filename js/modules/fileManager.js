/* ============================================================
   File Manager & Drag-Drop Module
   ============================================================ */

import { postToApi, showToast, escapeHtml, formatFileSize, fixEncoding, getFilePreviewType, API_UPLOAD } from './api.js';
import { openLightbox } from './lightbox.js';

let fileState = {
  files: [],
  searchQuery: '',
  typeFilter: 'all'
};

export function initFileManager() {
  const uploadInput = document.getElementById('file-upload-input');
  const searchInput = document.getElementById('file-search-input');
  const searchClear = document.getElementById('file-search-clear');
  const typeTabs = document.getElementById('file-type-tabs');

  if (uploadInput) {
    uploadInput.addEventListener('change', () => {
      if (uploadInput.files && uploadInput.files.length > 0) {
        uploadFiles(uploadInput.files);
        uploadInput.value = '';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      fileState.searchQuery = searchInput.value;
      if (searchClear) searchClear.classList.toggle('hidden', !fileState.searchQuery);
      renderFilesList();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      fileState.searchQuery = '';
      searchClear.classList.add('hidden');
      renderFilesList();
    });
  }

  if (typeTabs) {
    typeTabs.querySelectorAll('.file-type-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        typeTabs.querySelectorAll('.file-type-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fileState.typeFilter = btn.getAttribute('data-type');
        renderFilesList();
      });
    });
  }

  initDragAndDropOverlay();
}

export async function loadFiles() {
  try {
    const data = await postToApi(API_UPLOAD, { action: 'list' });
    if (data.error) {
      if (data.error === 'unauthorized') return;
      showToast('ファイル一覧の取得に失敗: ' + data.error);
      return;
    }
    fileState.files = data.files || [];
    renderFilesList();
    if (data.server) {
      updateServerDashboard(data.server);
    }
  } catch (e) {
    // Fail gracefully
  }
}

export function renderFilesList() {
  const container = document.getElementById('files-list');
  if (!container) return;

  container.innerHTML = '';

  if (fileState.files.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">ファイルがありません</p>';
    return;
  }

  const query = (fileState.searchQuery || '').toLowerCase().trim();
  const filter = fileState.typeFilter || 'all';

  const filtered = fileState.files.filter(f => {
    const displayName = fixEncoding(f.name);
    if (query && !displayName.toLowerCase().includes(query)) return false;
    if (filter !== 'all') {
      const pType = getFilePreviewType(displayName);
      if (filter === 'image' && pType !== 'image') return false;
      if (filter === 'doc' && pType !== 'pdf' && pType !== 'office') return false;
      if (filter === 'zip' && pType !== 'zip') return false;
      if (filter === 'video' && pType !== 'video') return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">一致するファイルが見つかりません</p>';
    return;
  }

  filtered.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';

    const displayName = fixEncoding(f.name);
    const previewType = getFilePreviewType(displayName);
    const canPreview = !!previewType;
    let thumbHtml;

    if (previewType === 'image') {
      thumbHtml = '<div class="file-thumb file-thumb-preview"><img src="uploads/' + encodeURIComponent(f.name) + '" alt="" loading="lazy" /></div>';
    } else {
      const ext = displayName.split('.').pop().toUpperCase().substring(0, 4);
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

    if (canPreview) {
      const thumbEl = item.querySelector('.file-thumb-preview');
      const infoEl = item.querySelector('.file-info-preview');
      const openPrev = (e) => {
        e.stopPropagation();
        openLightbox(f.name, fileState.files);
      };
      if (thumbEl) thumbEl.addEventListener('click', openPrev);
      if (infoEl) infoEl.addEventListener('click', openPrev);
    }

    const copyBtn = item.querySelector('.copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = location.origin + location.pathname.replace(/\/[^/]*$/, '/uploads/') + encodeURIComponent(f.name);
        navigator.clipboard.writeText(url);
        showToast('URLをコピーしました');
      });
    }

    const delBtn = item.querySelector('.delete');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(f.name);
      });
    }

    container.appendChild(item);
  });
}

export async function uploadFiles(filesList) {
  for (let i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    showToast('アップロード中: ' + file.name);

    try {
      const fd = new FormData();
      fd.append('action', 'upload');
      fd.append('file', file);

      const res = await fetch(API_UPLOAD, { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();

      if (data.error) {
        showToast('失敗: ' + data.error);
      } else {
        showToast('「' + file.name + '」をアップロードしました');
      }
    } catch (e) {
      showToast('アップロードに失敗しました');
    }
  }

  await loadFiles();
}

async function deleteFile(filename) {
  if (!confirm('「' + filename + '」を削除しますか？')) return;

  try {
    const data = await postToApi(API_UPLOAD, { action: 'delete', filename: filename });
    if (data.error) {
      showToast('削除失敗: ' + data.error);
    } else {
      showToast('削除しました');
      await loadFiles();
    }
  } catch (e) {
    showToast('削除に失敗しました');
  }
}

function updateServerDashboard(srv) {
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '--';
  };

  setTxt('server-cpu', srv.cpu_info);
  setTxt('server-load', srv.load_avg);
  setTxt('server-arch', srv.arch);
  setTxt('server-ram-total', srv.total_mem);
  setTxt('server-ram-free', srv.free_mem);
  setTxt('server-proc', srv.processes);
  setTxt('server-os', srv.os);
  setTxt('server-hostname', srv.hostname);
  setTxt('server-uptime', srv.uptime);
  setTxt('server-perl', srv.perl_ver);
  setTxt('storage-total', srv.disk_total);
  setTxt('storage-used', srv.disk_used);
  setTxt('storage-free', srv.disk_free);

  const pct = srv.disk_pct || 0;
  const bar = document.getElementById('storage-bar-fill');
  if (bar) bar.style.width = pct + '%';

  const badge = document.getElementById('storage-pct-badge');
  if (badge) badge.textContent = pct + '% 使用中';
}

function initDragAndDropOverlay() {
  const overlay = document.getElementById('drag-overlay');
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      if (overlay) overlay.classList.remove('hidden');
    }
  });

  window.addEventListener('dragover', (e) => e.preventDefault());

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (overlay) overlay.classList.add('hidden');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.add('hidden');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesTab = document.querySelector('.sidebar-tab[data-tab="files"]');
      if (filesTab) filesTab.click();
      uploadFiles(e.dataTransfer.files);
    }
  });
}

export function showServerDashboard() {
  const dash = document.getElementById('server-dashboard');
  const editorContainer = document.getElementById('editor-container');
  const noteTitle = document.getElementById('note-title');
  const mdTools = document.getElementById('md-tools');
  const viewModeBtn = document.getElementById('view-mode-btn');
  const saveBtn = document.getElementById('save-btn');
  const saveIndicator = document.getElementById('save-indicator');
  const statusBar = document.querySelector('.status-bar');

  if (dash) dash.classList.remove('hidden');
  if (editorContainer) editorContainer.classList.add('hidden');
  if (noteTitle) {
    noteTitle.value = 'JAIST サーバーシステム情報';
    noteTitle.disabled = true;
  }
  if (mdTools) mdTools.classList.add('hidden');
  if (viewModeBtn) viewModeBtn.classList.add('hidden');
  if (saveBtn) saveBtn.classList.add('hidden');
  if (saveIndicator) saveIndicator.classList.add('hidden');
  if (statusBar) statusBar.classList.add('hidden');

  loadFiles();
}

export function hideServerDashboard() {
  const dash = document.getElementById('server-dashboard');
  const editorContainer = document.getElementById('editor-container');
  const noteTitle = document.getElementById('note-title');
  const saveBtn = document.getElementById('save-btn');
  const saveIndicator = document.getElementById('save-indicator');
  const statusBar = document.querySelector('.status-bar');

  if (dash) dash.classList.add('hidden');
  if (editorContainer) editorContainer.classList.remove('hidden');
  if (noteTitle) noteTitle.disabled = false;
  if (saveBtn) saveBtn.classList.remove('hidden');
  if (saveIndicator) saveIndicator.classList.remove('hidden');
  if (statusBar) statusBar.classList.remove('hidden');
}

