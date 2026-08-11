/* ============================================================
   Online Notepad — Main Application Entry Point (ES Module)
   ============================================================ */

import { postToApi, showToast, sanitizeName, API_AUTH, API_NOTES } from './modules/api.js';
import { initTheme } from './modules/theme.js';
import { initI18n, setLanguage, t } from './modules/i18n.js';
import { initNotepad, loadNotes, openNote } from './modules/notepad.js';
import { initFileManager, loadFiles, showServerDashboard, hideServerDashboard } from './modules/fileManager.js';
import { initLightbox } from './modules/lightbox.js';

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initTheme();
  initNotepad();
  initFileManager();
  initLightbox();
  initAppShell();
  checkAuth();
});

async function checkAuth() {
  try {
    const data = await postToApi(API_AUTH, { action: 'check' });
    if (data.authenticated) {
      showApp();
    }
  } catch (e) {
    // Not authenticated
  }
}

function showApp() {
  const overlay = document.getElementById('overlay');
  const app = document.getElementById('app');

  if (overlay) overlay.classList.remove('active');
  if (app) app.classList.remove('hidden');

  loadNotes();
  loadFiles();
}

function initAppShell() {
  // Language Switcher Buttons
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-lang-val');
      if (val) setLanguage(val);
    });
  });

  // Password Form submit
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const authError = document.getElementById('auth-error');

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (authError) authError.classList.add('hidden');
      const pw = passwordInput ? passwordInput.value : '';
      if (!pw) return;

      try {
        const data = await postToApi(API_AUTH, { action: 'login', password: pw });
        if (data.success) {
          showApp();
        } else {
          if (authError) {
            authError.textContent = data.error || t('auth.error_wrong');
            authError.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (authError) {
          authError.textContent = err.message || t('auth.error_network');
          authError.classList.remove('hidden');
        }
      }
    });
  }

  // Sidebar Tabs (Notes / Files)
  const sidebarTabs = document.querySelectorAll('.sidebar-tab');
  sidebarTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sidebarTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      const panelNotes = document.getElementById('panel-notes');
      const panelFiles = document.getElementById('panel-files');

      if (panelNotes) panelNotes.classList.toggle('active', targetTab === 'notes');
      if (panelFiles) panelFiles.classList.toggle('active', targetTab === 'files');

      if (targetTab === 'files') {
        showServerDashboard();
      } else {
        hideServerDashboard();
      }
    });
  });

  // Sidebar Mobile Toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const mobileSidebarBtn = document.getElementById('mobile-sidebar-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebar = document.getElementById('sidebar');

  const toggleSidebar = () => {
    const isMobile = window.innerWidth <= 700;
    if (!sidebar) return;

    if (isMobile) {
      const isMobileOpen = sidebar.classList.contains('mobile-open');
      if (isMobileOpen) {
        sidebar.classList.remove('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
      } else {
        sidebar.classList.add('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
      }
    } else {
      sidebar.classList.toggle('collapsed');
      sidebar.classList.remove('mobile-open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
    }
  };

  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (mobileSidebarBtn) mobileSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('mobile-open');
      sidebarBackdrop.classList.remove('show');
    });
  }

  // New Note Modal
  const newNoteBtn = document.getElementById('new-note-btn');
  const newNoteModal = document.getElementById('new-note-modal');
  const newNoteName = document.getElementById('new-note-name');
  const newNoteCancel = document.getElementById('new-note-cancel');
  const newNoteConfirm = document.getElementById('new-note-confirm');

  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => {
      if (newNoteName) newNoteName.value = '';
      if (newNoteModal) newNoteModal.classList.remove('hidden');
      if (newNoteName) newNoteName.focus();
    });
  }
  if (newNoteCancel && newNoteModal) {
    newNoteCancel.addEventListener('click', () => newNoteModal.classList.add('hidden'));
  }
  if (newNoteConfirm) {
    newNoteConfirm.addEventListener('click', async () => {
      const name = sanitizeName(newNoteName ? newNoteName.value : '');
      if (!name) {
        showToast(t('toast.note_name_required'));
        return;
      }

      const fmtRadio = document.querySelector('input[name="new-note-fmt"]:checked');
      const fmt = fmtRadio ? fmtRadio.value : 'txt';
      const fn = name + '.' + fmt;

      try {
        const data = await postToApi(API_NOTES, { action: 'save', filename: fn, content: '' });
        if (data.error) {
          showToast(t('toast.note_create_failed', { error: data.error }));
          return;
        }
        if (newNoteModal) newNoteModal.classList.add('hidden');
        showToast(t('toast.note_created', { name: name }));
        await loadNotes();
        openNote({ filename: fn, title: name, format: fmt });
      } catch (e) {
        showToast(t('toast.note_create_error'));
      }
    });
  }

  // Password Change Modal
  const changePwBtn = document.getElementById('change-password-btn');
  const changePwModal = document.getElementById('change-pw-modal');
  const changePwCancel = document.getElementById('change-pw-cancel');
  const changePwConfirm = document.getElementById('change-pw-confirm');
  const currentPw = document.getElementById('current-pw');
  const newPw = document.getElementById('new-pw');
  const confirmPw = document.getElementById('confirm-pw');
  const pwChangeError = document.getElementById('pw-change-error');

  if (changePwBtn && changePwModal) {
    changePwBtn.addEventListener('click', () => {
      if (currentPw) currentPw.value = '';
      if (newPw) newPw.value = '';
      if (confirmPw) confirmPw.value = '';
      if (pwChangeError) pwChangeError.classList.add('hidden');
      changePwModal.classList.remove('hidden');
    });
  }
  if (changePwCancel && changePwModal) {
    changePwCancel.addEventListener('click', () => changePwModal.classList.add('hidden'));
  }
  const changePwForm = document.getElementById('change-pw-form');
  if (changePwForm) {
    changePwForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (changePwConfirm) changePwConfirm.click();
    });
  }

  if (changePwConfirm) {
    changePwConfirm.addEventListener('click', async () => {
      const cur = currentPw ? currentPw.value : '';
      const n1 = newPw ? newPw.value : '';
      const n2 = confirmPw ? confirmPw.value : '';

      if (!cur || !n1 || !n2) {
        if (pwChangeError) {
          pwChangeError.textContent = t('toast.fill_all_fields');
          pwChangeError.classList.remove('hidden');
        }
        return;
      }

      if (n1 !== n2) {
        if (pwChangeError) {
          pwChangeError.textContent = t('toast.pw_mismatch');
          pwChangeError.classList.remove('hidden');
        }
        return;
      }

      if (n1.length < 4) {
        if (pwChangeError) {
          pwChangeError.textContent = t('toast.pw_min_length');
          pwChangeError.classList.remove('hidden');
        }
        return;
      }

      try {
        const data = await postToApi(API_AUTH, { action: 'change_password', current_password: cur, new_password: n1 });
        if (data.success) {
          showToast(t('toast.pw_changed'));
          if (changePwModal) changePwModal.classList.add('hidden');
        } else {
          if (pwChangeError) {
            pwChangeError.textContent = data.error || t('toast.pw_change_failed');
            pwChangeError.classList.remove('hidden');
          }
        }
      } catch (e) {
        if (pwChangeError) {
          pwChangeError.textContent = t('auth.error_network');
          pwChangeError.classList.remove('hidden');
        }
      }
    });
  }

  // Logout / Lock Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await postToApi(API_AUTH, { action: 'logout' });
      } catch (e) {}

      const overlay = document.getElementById('overlay');
      const app = document.getElementById('app');
      if (overlay) overlay.classList.add('active');
      if (app) app.classList.add('hidden');
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  }
}
