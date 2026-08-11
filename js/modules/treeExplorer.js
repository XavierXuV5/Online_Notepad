/* ============================================================
   Windows Explorer Style Archive Tree & WebAssembly Lazy Loading Module
   ============================================================ */

import { escapeHtml, fixEncoding, formatFileSize } from './api.js';

let wasmArchiveModule = null;

/**
 * Lazy import and initialize WebAssembly libarchivejs module on-demand
 */
export async function ensureLibarchiveLoaded() {
  if (wasmArchiveModule) return wasmArchiveModule;

  try {
    const basePath = location.pathname.replace(/\/[^/]*$/, '/');
    const wasmMainUrl = new URL('libarchive/main.js', location.origin + basePath).href;
    const workerUrl = new URL('libarchive/worker-bundle.js', location.origin + basePath).href;

    const mod = await import(wasmMainUrl);
    if (mod && mod.Archive) {
      mod.Archive.init({ workerUrl: workerUrl });
      wasmArchiveModule = mod.Archive;
      return wasmArchiveModule;
    }
  } catch (err) {
    console.error('Failed to lazy load libarchive WASM module:', err);
  }
  return null;
}

export function getFileIcon(fileName) {
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(fileName)) return '🖼️';
  if (/\.(pdf)$/i.test(fileName)) return '📕';
  if (/\.(ppt|pptx|doc|docx|xls|xlsx)$/i.test(fileName)) return '📊';
  if (/\.(mp4|webm|ogg|mov)$/i.test(fileName)) return '🎬';
  if (/\.(txt|md|json|js|css|html|xml|log|py|c|cpp|h|java|sh|pl|php|rs|go|sql|yml|yaml|ini)$/i.test(fileName)) return '📄';
  if (/\.(zip|7z|rar|tar|gz|bz2|xz|jar|epub)$/i.test(fileName)) return '📦';
  return '📄';
}

export function buildArchiveTree(flatEntries) {
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

export function renderArchiveTreeHtml(node) {
  if (!node.children) return '';

  const childNames = Object.keys(node.children).sort((a, b) => {
    const itemA = node.children[a];
    const itemB = node.children[b];
    if (itemA.isDir && !itemB.isDir) return -1;
    if (!itemA.isDir && itemB.isDir) return 1;
    return a.localeCompare(b);
  });

  let html = '';
  childNames.forEach(name => {
    const child = node.children[name];
    if (child.isDir) {
      html += '<div class="tree-folder">';
      html += '  <div class="tree-row" data-tree-path="' + escapeHtml(child.path) + '">';
      html += '    <span class="tree-toggle">▼</span>';
      html += '    <span class="tree-folder-icon tree-icon"></span>';
      html += '    <span class="tree-name" title="' + escapeHtml(child.name) + '">' + escapeHtml(child.name) + '</span>';
      html += '  </div>';
      html += '  <div class="tree-children">';
      html += renderArchiveTreeHtml(child);
      html += '  </div>';
      html += '</div>';
    } else {
      const isPreviewable = /\.(png|jpg|jpeg|gif|webp|svg|pdf|txt|md|json|js|css|html|xml|log|py|c|cpp|h|java|sh|pl)$/i.test(child.name);
      const fileIcon = getFileIcon(child.name);
      html += '<div class="tree-file">';
      html += '  <div class="tree-row" data-tree-path="' + escapeHtml(child.path) + '">';
      html += '    <span class="tree-toggle" style="visibility:hidden">▶</span>';
      html += '    <span class="tree-icon">' + fileIcon + '</span>';
      html += '    <span class="tree-name" title="' + escapeHtml(child.name) + '">' + escapeHtml(child.name) + '</span>';
      html += '    <span class="tree-size">' + formatFileSize(child.size) + '</span>';
      if (isPreviewable) {
        html += '    <span class="zip-entry-link" data-tree-extract="' + escapeHtml(child.path) + '">プレビュー</span>';
      }
      html += '  </div>';
      html += '</div>';
    }
  });

  return html;
}

export function attachTreeExplorerEvents(containerEl, rootNode, onExtractFile) {
  containerEl.querySelectorAll('.tree-folder > .tree-row').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderEl = row.closest('.tree-folder');
      if (folderEl) {
        folderEl.classList.toggle('collapsed');
      }
    });
  });

  containerEl.querySelectorAll('[data-tree-extract]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const path = btn.getAttribute('data-tree-extract');
      const box = document.getElementById('zip-preview-box');
      if (!box) return;

      box.classList.remove('hidden');
      box.innerHTML = '<div style="color:rgba(255,255,255,0.6)">「' + escapeHtml(path) + '」解凍中…</div>';

      const findNode = (n, targetPath) => {
        if (!n || !n.children) return null;
        for (const k of Object.keys(n.children)) {
          const child = n.children[k];
          if (child.path === targetPath) return child;
          if (child.isDir) {
            const found = findNode(child, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNode(rootNode, path);
      if (targetNode && onExtractFile) {
        try {
          await onExtractFile(targetNode, box);
        } catch (err) {
          box.innerHTML = '<div style="color:var(--danger)">解凍エラー: ' + escapeHtml(err.message) + '</div>';
        }
      }
    });
  });
}

export function renderTreeExplorer(zipName, flatEntries, onExtractFile, badgeText) {
  const rootNode = buildArchiveTree(flatEntries);

  let html = '';
  html += '<div class="zip-header">';
  html += '  <div class="zip-title">📦 ' + escapeHtml(zipName) + '</div>';
  html += '  <div class="zip-meta">' + (badgeText || (flatEntries.length + ' 個のアイテム')) + '</div>';
  html += '</div>';

  html += '<div class="tree-explorer-container">';
  html += '  <div class="tree-view-root">';
  html += renderArchiveTreeHtml(rootNode);
  html += '  </div>';
  html += '</div>';

  html += '<div id="zip-preview-box" class="hidden"></div>';

  const lightboxZip = document.getElementById('lightbox-zip');
  if (!lightboxZip) return;

  lightboxZip.innerHTML = html;
  lightboxZip.classList.remove('hidden');

  attachTreeExplorerEvents(lightboxZip, rootNode, onExtractFile);
}
