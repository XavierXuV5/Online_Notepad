/* ============================================================
   API & Utilities Module
   ============================================================ */

export const API_AUTH   = '../cgi-bin/auth.pl';
export const API_NOTES  = '../cgi-bin/notes.pl';
export const API_UPLOAD = '../cgi-bin/upload.pl';

/**
 * Send POST request to CGI API with AbortController timeout support
 */
export async function postToApi(url, data, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) {
      fd.append(k, v);
    }

    const res = await fetch(url, {
      method: 'POST',
      body: fd,
      credentials: 'include',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTPエラー ${res.status}`);
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      throw new Error('CGIスクリプトから空の応答が返されました');
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error('API Response Parsing Failed:', text);
      throw new Error('サーバー応答のJSON解析に失敗しました');
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました');
    }
    throw err;
  }
}

/**
 * Show Toast Notification
 */
export function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 250);
  }, duration);
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Sanitize filename
 */
export function sanitizeName(name) {
  if (!name) return '';
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

/**
 * Format File Size
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Smart encoding repair for Chinese / CJK Mojibake filenames
 */
const cp1252Map = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02DC,
  0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};

const unicodeToByteMap = {};
for (let b = 0; b < 256; b++) unicodeToByteMap[b] = b;
Object.keys(cp1252Map).forEach(b => { unicodeToByteMap[cp1252Map[b]] = parseInt(b, 10); });

export function fixEncoding(str) {
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

export function getFilePreviewType(filename) {
  if (!filename) return null;
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(filename)) return 'image';
  if (/\.(mp4|webm|ogg|mov)$/i.test(filename)) return 'video';
  if (/\.(pdf)$/i.test(filename)) return 'pdf';
  if (/\.(ppt|pptx|doc|docx|xls|xlsx)$/i.test(filename)) return 'office';
  if (/\.(zip|jar|epub|7z|rar|tar|gz|bz2|xz)$/i.test(filename)) return 'zip';
  return null;
}
