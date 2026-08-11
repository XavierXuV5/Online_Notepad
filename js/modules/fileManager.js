/* ============================================================
   File Manager, Folder Navigation, Renaming & Drag-Drop Module
   ============================================================ */

import { postToApi, showToast, escapeHtml, formatFileSize, fixEncoding, getFilePreviewType, API_UPLOAD } from './api.js';
import { openLightbox } from './lightbox.js';
import { t } from './i18n.js';

let fileState = {
  files: [],
  dirs: [],
  currentPath: '',
  searchQuery: '',
  typeFilter: 'all',
  renameTarget: null
};

export function initFileManager() {
  const uploadInput = document.getElementById('file-upload-input');
  const folderUploadInput = document.getElementById('folder-upload-input');
  const newFolderBtn = document.getElementById('new-folder-btn');
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

  if (folderUploadInput) {
    folderUploadInput.addEventListener('change', () => {
      if (folderUploadInput.files && folderUploadInput.files.length > 0) {
        uploadFiles(folderUploadInput.files);
        folderUploadInput.value = '';
      }
    });
  }

  if (newFolderBtn) {
    newFolderBtn.addEventListener('click', openNewFolderModal);
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

  initFolderModalEvents();
  initRenameModalEvents();
  initDragAndDropOverlay();
}

export async function loadFiles(subPath = '') {
  fileState.currentPath = subPath;
  try {
    const data = await postToApi(API_UPLOAD, { action: 'list', path: subPath });
    if (data.error) {
      if (data.error === 'unauthorized') return;
      showToast(t('uploadFail', { error: data.error }));
      return;
    }
    fileState.files = data.files || [];
    fileState.dirs = data.dirs || [];
    renderBreadcrumbs();
    renderFilesList();
    if (data.server) {
      updateServerDashboard(data.server);
    }
  } catch (e) {
    // Fail gracefully
  }
}

function renderBreadcrumbs() {
  const container = document.getElementById('file-breadcrumbs');
  if (!container) return;

  const parts = fileState.currentPath.split('/').filter(Boolean);
  let html = '<span class="crumb-item' + (parts.length === 0 ? ' active' : '') + '" data-path="">' + escapeHtml(t('rootFolder')) + '</span>';

  let accum = '';
  parts.forEach((p, i) => {
    accum += (accum ? '/' : '') + p;
    const isLast = (i === parts.length - 1);
    html += '<span class="crumb-separator">/</span>';
    html += '<span class="crumb-item' + (isLast ? ' active' : '') + '" data-path="' + escapeHtml(accum) + '">' + escapeHtml(p) + '</span>';
  });

  container.innerHTML = html;

  container.querySelectorAll('.crumb-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-path');
      loadFiles(path);
    });
  });
}

export function renderFilesList() {
  const container = document.getElementById('files-list');
  if (!container) return;

  container.innerHTML = '';

  const totalItems = fileState.dirs.length + fileState.files.length;
  if (totalItems === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:24px;font-size:12px">' + escapeHtml(t('noFiles')) + '</p>';
    return;
  }

  const query = (fileState.searchQuery || '').toLowerCase().trim();
  const filter = fileState.typeFilter || 'all';

  // Render Folders
  fileState.dirs.forEach(d => {
    const displayName = fixEncoding(d.name);
    if (query && !displayName.toLowerCase().includes(query)) return;

    const item = document.createElement('div');
    item.className = 'file-item folder-item';
    item.innerHTML =
      '<div class="file-thumb folder-thumb">📁</div>' +
      '<div class="file-info file-info-preview">' +
        '<div class="file-name" title="' + escapeHtml(displayName) + '">' + escapeHtml(displayName) + '</div>' +
        '<div class="file-size">文件夹</div>' +
      '</div>' +
      '<div class="file-actions">' +
        '<button class="file-action-btn rename" title="重命名">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="file-action-btn delete" title="删除">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
        '</button>' +
      '</div>';

    // Enter folder click handler
    item.querySelector('.file-info-preview').addEventListener('click', () => {
      const nextPath = fileState.currentPath ? fileState.currentPath + '/' + d.name : d.name;
      loadFiles(nextPath);
    });

    item.querySelector('.rename').addEventListener('click', (e) => {
      e.stopPropagation();
      openRenameModal(d.name, true);
    });

    item.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFileOrFolder(d.name, true);
    });

    container.appendChild(item);
  });

  // Render Files
  const filteredFiles = fileState.files.filter(f => {
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

  filteredFiles.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';

    const displayName = fixEncoding(f.name);
    const previewType = getFilePreviewType(displayName);
    const canPreview = !!previewType;
    let thumbHtml;

    const fullFilePath = fileState.currentPath ? 'uploads/' + fileState.currentPath + '/' + encodeURIComponent(f.name) : 'uploads/' + encodeURIComponent(f.name);

    if (previewType === 'image') {
      thumbHtml = '<div class="file-thumb file-thumb-preview"><img src="' + fullFilePath + '" alt="" loading="lazy" /></div>';
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
        '<button class="file-action-btn rename" title="重命名">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
        '</button>' +
        '<button class="file-action-btn copy" title="复制链接">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '</button>' +
        '<button class="file-action-btn delete" title="删除">' +
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

    const renameBtn = item.querySelector('.rename');
    if (renameBtn) {
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRenameModal(f.name, false);
      });
    }

    const copyBtn = item.querySelector('.copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = location.origin + location.pathname.replace(/\/[^/]*$/, '/') + fullFilePath;
        navigator.clipboard.writeText(url);
        showToast(t('copyUrlSuccess'));
      });
    }

    const delBtn = item.querySelector('.delete');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFileOrFolder(f.name, false);
      });
    }

    container.appendChild(item);
  });
}

export async function uploadFiles(filesList) {
  const total = filesList.length;
  for (let i = 0; i < total; i++) {
    const file = filesList[i];
    const relPath = file.webkitRelativePath || file.name;
    showToast(t('uploading', { name: file.name }));

    try {
      const fd = new FormData();
      fd.append('action', 'upload');
      fd.append('file', file);
      if (fileState.currentPath) {
        fd.append('relative_path', fileState.currentPath + '/' + relPath);
      } else if (file.webkitRelativePath) {
        fd.append('relative_path', file.webkitRelativePath);
      }

      const res = await fetch(API_UPLOAD, { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json();

      if (data.error) {
        showToast(t('uploadFail', { error: data.error }));
      } else {
        showToast(t('uploadSuccess', { name: file.name }));
      }
    } catch (e) {
      showToast(t('uploadFail', { error: e.message || 'Error' }));
    }
  }

  await loadFiles(fileState.currentPath);
}

function openNewFolderModal() {
  const modal = document.getElementById('new-folder-modal');
  const input = document.getElementById('new-folder-name');
  if (input) input.value = '';
  if (modal) modal.classList.remove('hidden');
  if (input) input.focus();
}

function initFolderModalEvents() {
  const modal = document.getElementById('new-folder-modal');
  const cancelBtn = document.getElementById('new-folder-cancel');
  const confirmBtn = document.getElementById('new-folder-confirm');
  const input = document.getElementById('new-folder-name');

  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const folderName = (input ? input.value : '').trim();
      if (!folderName) return;

      try {
        const fullFolderName = fileState.currentPath ? fileState.currentPath + '/' + folderName : folderName;
        const data = await postToApi(API_UPLOAD, { action: 'mkdir', folder_name: fullFolderName });

        if (data.error) {
          showToast(t('mkdirFail', { error: data.error }));
        } else {
          showToast(t('mkdirSuccess', { name: folderName }));
          if (modal) modal.classList.add('hidden');
          await loadFiles(fileState.currentPath);
        }
      } catch (e) {
        showToast(t('mkdirFail', { error: e.message || 'Error' }));
      }
    });
  }
}

function openRenameModal(name, isFolder) {
  fileState.renameTarget = { name, isFolder };
  const modal = document.getElementById('file-rename-modal');
  const input = document.getElementById('file-rename-input');
  if (input) input.value = name;
  if (modal) modal.classList.remove('hidden');
  if (input) input.focus();
}

function initRenameModalEvents() {
  const modal = document.getElementById('file-rename-modal');
  const cancelBtn = document.getElementById('file-rename-cancel');
  const confirmBtn = document.getElementById('file-rename-confirm');
  const input = document.getElementById('file-rename-input');

  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!fileState.renameTarget) return;
      const newName = (input ? input.value : '').trim();
      const oldName = fileState.renameTarget.name;
      if (!newName || newName === oldName) return;

      try {
        const oldPath = fileState.currentPath ? fileState.currentPath + '/' + oldName : oldName;
        const newPath = fileState.currentPath ? fileState.currentPath + '/' + newName : newName;

        const data = await postToApi(API_UPLOAD, { action: 'rename', old_name: oldPath, new_name: newPath });

        if (data.error) {
          showToast(t('renameFail', { error: data.error }));
        } else {
          showToast(t('renameSuccess'));
          if (modal) modal.classList.add('hidden');
          await loadFiles(fileState.currentPath);
        }
      } catch (e) {
        showToast(t('renameFail', { error: e.message || 'Error' }));
      }
    });
  }
}

async function deleteFileOrFolder(filename, isFolder) {
  const fullPath = fileState.currentPath ? fileState.currentPath + '/' + filename : filename;
  if (!confirm(t('deleteConfirm', { name: filename }))) return;

  try {
    const data = await postToApi(API_UPLOAD, { action: 'delete', filename: fullPath });
    if (data.error) {
      showToast(t('deleteFail', { error: data.error }));
    } else {
      showToast(t('deleteSuccess'));
      await loadFiles(fileState.currentPath);
    }
  } catch (e) {
    showToast(t('deleteFail', { error: e.message || 'Error' }));
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
  if (badge) badge.textContent = pct + '% ' + t('storageUsage');
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

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (overlay) overlay.classList.add('hidden');

    if (e.dataTransfer && e.dataTransfer.items) {
      const items = e.dataTransfer.items;
      const filesToUpload = [];

      const scanEntry = async (entry, path = '') => {
        if (entry.isFile) {
          const file = await new Promise(resolve => entry.file(resolve));
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path ? path + '/' + file.name : file.name
          });
          filesToUpload.push(file);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = await new Promise(resolve => dirReader.readEntries(resolve));
          for (const child of entries) {
            await scanEntry(child, path ? path + '/' + entry.name : entry.name);
          }
        }
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) await scanEntry(entry);
        }
      }

      if (filesToUpload.length > 0) {
        const filesTab = document.querySelector('.sidebar-tab[data-tab="files"]');
        if (filesTab) filesTab.click();
        uploadFiles(filesToUpload);
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesTab = document.querySelector('.sidebar-tab[data-tab="files"]');
        if (filesTab) filesTab.click();
        uploadFiles(e.dataTransfer.files);
      }
    }
  });
}
