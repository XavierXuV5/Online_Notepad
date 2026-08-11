/* ============================================================
   Lightbox & Archive Preview Module
   ============================================================ */

import { escapeHtml, getFilePreviewType, API_UPLOAD } from './api.js';
import { renderTreeExplorer, ensureLibarchiveLoaded } from './treeExplorer.js';

let lightboxState = {
  index: 0,
  files: []
};

export function initLightbox() {
  const closeBtn = document.getElementById('lightbox-close');
  const backdrop = document.querySelector('#image-lightbox .lightbox-backdrop');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); lightboxPrev(); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); lightboxNext(); });

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('image-lightbox');
    if (!lightbox || lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lightboxPrev();
    else if (e.key === 'ArrowRight') lightboxNext();
  });
}

export function openLightbox(filename, allFiles) {
  const previewableFiles = allFiles.filter(f => getFilePreviewType(f.name) !== null);
  let idx = previewableFiles.findIndex(f => f.name === filename);
  if (idx === -1) return;

  lightboxState.index = idx;
  lightboxState.files = previewableFiles;

  showLightboxFile(idx);

  const lightbox = document.getElementById('image-lightbox');
  if (lightbox) {
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

export function closeLightbox() {
  const lightbox = document.getElementById('image-lightbox');
  if (lightbox) lightbox.classList.add('hidden');
  document.body.style.overflow = '';
  hideLightboxContent();
}

function lightboxPrev() {
  if (lightboxState.files.length === 0) return;
  lightboxState.index = (lightboxState.index - 1 + lightboxState.files.length) % lightboxState.files.length;
  showLightboxFile(lightboxState.index);
}

function lightboxNext() {
  if (lightboxState.files.length === 0) return;
  lightboxState.index = (lightboxState.index + 1) % lightboxState.files.length;
  showLightboxFile(lightboxState.index);
}

function hideLightboxContent() {
  const video = document.getElementById('lightbox-video');
  const iframe = document.getElementById('lightbox-iframe');
  const img = document.getElementById('lightbox-img');
  const zip = document.getElementById('lightbox-zip');

  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.classList.add('hidden');
  }
  if (iframe) {
    iframe.src = 'about:blank';
    iframe.classList.add('hidden');
  }
  if (img) {
    img.src = '';
    img.classList.add('hidden');
  }
  if (zip) {
    zip.innerHTML = '';
    zip.classList.add('hidden');
  }
}

function showLightboxFile(idx) {
  const f = lightboxState.files[idx];
  if (!f) return;

  const type = getFilePreviewType(f.name);
  const fileUrl = 'uploads/' + encodeURIComponent(f.name);

  hideLightboxContent();

  const titleEl = document.getElementById('lightbox-filename');
  if (titleEl) titleEl.textContent = f.name;

  const img = document.getElementById('lightbox-img');
  const video = document.getElementById('lightbox-video');
  const iframe = document.getElementById('lightbox-iframe');
  const zipBox = document.getElementById('lightbox-zip');

  if (type === 'image' && img) {
    img.src = fileUrl;
    img.alt = f.name;
    img.classList.remove('hidden');
  } else if (type === 'video' && video) {
    video.src = fileUrl;
    video.classList.remove('hidden');
  } else if (type === 'pdf' && iframe) {
    iframe.src = fileUrl;
    iframe.classList.remove('hidden');
  } else if (type === 'office' && iframe) {
    const fullUrl = location.origin + location.pathname.replace(/\/[^/]*$/, '/uploads/') + encodeURIComponent(f.name);
    iframe.src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(fullUrl);
    iframe.classList.remove('hidden');
  } else if (type === 'zip' && zipBox) {
    zipBox.classList.remove('hidden');
    loadArchivePreview(f.name);
  }
}

async function loadArchivePreview(filename) {
  const zipBox = document.getElementById('lightbox-zip');
  if (!zipBox) return;

  zipBox.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">ZIP アーカイブ解凍中…</div>';

  try {
    const fileUrl = 'uploads/' + encodeURIComponent(filename);
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    const file = new File([blob], filename);

    if (/\.(7z|rar|tar|gz|bz2|xz)$/i.test(filename)) {
      await loadLocalLibarchivePreview(file);
      return;
    }

    if (typeof JSZip !== 'undefined') {
      try {
        const zip = await JSZip.loadAsync(blob);
        const entries = Object.keys(zip.files).map(k => zip.files[k]);
        const flatEntries = entries.map(e => ({
          path: e.name,
          isDir: e.dir,
          size: e._data ? e._data.uncompressedSize || 0 : 0,
          file: e
        }));

        renderTreeExplorer(filename, flatEntries, async (node, box) => {
          const zipEntry = node.fileRef;
          if (!zipEntry) return;

          if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.name)) {
            const base64 = await zipEntry.async('base64');
            const ext = node.name.split('.').pop().toLowerCase();
            const mime = ext === 'svg' ? 'image/svg+xml' : 'image/' + ext;
            box.className = 'zip-inner-preview';
            box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">🖼️ ' + escapeHtml(node.path) + '</div><img src="data:' + mime + ';base64,' + base64 + '" class="zip-inner-img" />';
          } else if (/\.(pdf)$/i.test(node.name)) {
            const blobData = await zipEntry.async('blob');
            const pdfUrl = URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
            box.className = 'zip-inner-preview';
            box.style.maxHeight = 'none';
            box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div><iframe src="' + pdfUrl + '" class="zip-inner-iframe"></iframe>';
          } else {
            const text = await zipEntry.async('text');
            box.className = 'zip-inner-preview';
            box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(node.path) + '</div>' + escapeHtml(text.slice(0, 10000)) + (text.length > 10000 ? '\n\n... (一部のみ表示)' : '');
          }
        });
        return;
      } catch (err) {
        // Fallback to libarchive
        await loadLocalLibarchivePreview(file);
      }
    }
  } catch (err) {
    zipBox.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger)">アーカイブ読み込みエラー: ' + escapeHtml(err.message) + '</div>';
  }
}

async function loadLocalLibarchivePreview(file) {
  const zipBox = document.getElementById('lightbox-zip');
  if (!zipBox) return;

  zipBox.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.6)">⚡ WebAssembly (libarchivejs) で .7z アーカイブ解凍中…</div>';

  try {
    const Archive = await ensureLibarchiveLoaded();
    if (!Archive) {
      throw new Error('libarchive WebAssembly モジュールの読み込みに失敗しました。');
    }

    const archive = await Archive.open(file);

    if (archive.hasEncryptedData()) {
      const pass = prompt('🔒 暗号化された 7z アーカイブです。パスワードを入力してください:');
      if (pass) {
        await archive.usePassword(pass);
      }
    }

    const rawFiles = await archive.getFilesArray();
    const flatEntries = rawFiles.map(item => {
      const isDir = item.file && item.file._isDir ? true : (item.file && item.file.name ? false : true);
      const fullPath = item.path + (item.file ? item.file.name : '');
      return {
        path: fullPath,
        isDir: isDir,
        size: item.file ? item.file.size || 0 : 0,
        file: item.file
      };
    });

    renderTreeExplorer(file.name, flatEntries, async (node, box) => {
      const compressedFile = node.fileRef;
      if (!compressedFile) return;

      const extractedBlobFile = await compressedFile.extract();
      const targetPath = node.path;

      if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.name)) {
        const imgUrl = URL.createObjectURL(extractedBlobFile);
        box.className = 'zip-inner-preview';
        box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">🖼️ ' + escapeHtml(targetPath) + '</div><img src="' + imgUrl + '" class="zip-inner-img" />';
      } else if (/\.(pdf)$/i.test(node.name)) {
        const pdfUrl = URL.createObjectURL(extractedBlobFile);
        box.className = 'zip-inner-preview';
        box.style.maxHeight = 'none';
        box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(targetPath) + '</div><iframe src="' + pdfUrl + '" class="zip-inner-iframe"></iframe>';
      } else {
        const text = await extractedBlobFile.text();
        box.className = 'zip-inner-preview';
        box.innerHTML = '<div style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:11px">📄 ' + escapeHtml(targetPath) + '</div>' + escapeHtml(text.slice(0, 10000)) + (text.length > 10000 ? '\n\n... (一部のみ表示)' : '');
      }
    });

  } catch (err) {
    zipBox.innerHTML = '<div style="text-align:center;padding:30px;color:var(--danger)">7z アーカイブの解凍に失敗しました: ' + escapeHtml(err.message) + '</div>';
  }
}
