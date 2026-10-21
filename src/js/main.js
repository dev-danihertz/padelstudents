/**
 * Padel Coach CRM - Main Application Logic (Vanilla JavaScript)
 * 
 * Phase 2 enhancements:
 * 1. Supabase client integration & environment variable detection.
 * 2. Supabase Auth workflow: Sign In, Sign Up, Sign Out, session management.
 * 3. Reactive UI updates for connection status pills and user indicators.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { signIn, signUp, signOut, getSession, onAuthStateChange } from './auth.js';

// View configurations containing human-readable titles and descriptions
const VIEW_METADATA = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Welcome back! Overview of your padel coaching business.'
  },
  students: {
    title: 'Students Directory',
    subtitle: 'Manage student contacts, padel ratings, and lesson format preferences.'
  },
  'find-players': {
    title: 'Find Compatible Players',
    subtitle: 'Pair players by level compatibility and weekly availability.'
  },
  lessons: {
    title: 'Lessons & Sessions',
    subtitle: 'Schedule and manage 1:1 and group padel sessions.'
  },
  tabelas: {
    title: 'Tabelas',
    subtitle: 'Gestão e visualização das tabelas de dados do sistema.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Configure coaching parameters and system settings.'
  }
};

// Current application state
let currentUser = null;
let authMode = 'signin'; // 'signin' or 'signup'

/**
 * Switch the active view based on the given view identifier
 * @param {string} viewId - e.g., 'dashboard', 'students', 'find-players'
 */
function navigateTo(viewId) {
  const targetId = VIEW_METADATA[viewId] ? viewId : 'dashboard';
  const meta = VIEW_METADATA[targetId];

  // 1. Update navigation links (active styling)
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.dataset.view === targetId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // 2. Hide all view panels and show the selected one
  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.classList.remove('active');
  });

  const activePanel = document.getElementById(`view-${targetId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // 3. Update top-bar titles
  const titleEl = document.getElementById('current-page-title');
  const subtitleEl = document.getElementById('current-page-subtitle');
  if (titleEl) titleEl.textContent = meta.title;
  if (subtitleEl) subtitleEl.textContent = meta.subtitle;

  // 4. Update browser document title
  document.title = `${meta.title} | Padel Coach CRM`;

  // 5. If mobile sidebar is open, close it on navigation
  closeMobileSidebar();
}

/**
 * Handle browser URL hash changes (e.g. #students, #find-players)
 */
function handleHashChange() {
  const hash = window.location.hash.replace('#', '').trim();
  navigateTo(hash || 'dashboard');
}

/**
 * Setup mobile sidebar drawer toggle listeners
 */
function setupMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const openBtn = document.getElementById('open-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');

  if (openBtn && sidebar && backdrop) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
    });
  }

  if (closeBtn && sidebar && backdrop) {
    closeBtn.addEventListener('click', closeMobileSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
}

/**
 * Update UI elements to reflect Supabase connection & Auth status
 */
function updateConnectionUI() {
  // Elements
  const headerPillDot = document.getElementById('db-pill-dot');
  const headerPillLabel = document.getElementById('db-pill-label');
  const systemStatusDot = document.getElementById('system-status-dot');
  const systemStatusText = document.getElementById('system-status-text');
  const userDisplayName = document.getElementById('user-display-name');
  const userAuthStatus = document.getElementById('user-auth-status');
  const userAvatar = document.getElementById('user-avatar');
  const btnAuthLabel = document.getElementById('btn-auth-label');

  // Settings view elements
  const settingsDot = document.getElementById('settings-dot');
  const settingsConnText = document.getElementById('settings-connection-text');
  const settingsConnSubtext = document.getElementById('settings-connection-subtext');
  const settingsUrl = document.getElementById('settings-url-display');
  const settingsKey = document.getElementById('settings-key-display');
  const settingsAuth = document.getElementById('settings-auth-display');

  // Dashboard banner
  const dashBanner = document.getElementById('dashboard-db-banner');
  const dashIcon = document.getElementById('dashboard-banner-icon');
  const dashBody = document.getElementById('dashboard-banner-body');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (!isSupabaseConfigured) {
    // 1. Unconfigured state (No real .env yet)
    if (headerPillDot) headerPillDot.className = 'status-dot status-unconfigured';
    if (headerPillLabel) headerPillLabel.textContent = 'Supabase: Not Configured';

    if (systemStatusDot) systemStatusDot.className = 'status-dot status-unconfigured';
    if (systemStatusText) systemStatusText.textContent = 'Awaiting .env Setup';

    if (userDisplayName) userDisplayName.textContent = 'Coach Daniel';
    if (userAuthStatus) userAuthStatus.textContent = 'Local Offline Mode';
    if (userAvatar) userAvatar.textContent = 'DH';
    if (btnAuthLabel) btnAuthLabel.textContent = 'Setup Cloud DB';

    if (settingsDot) settingsDot.className = 'status-dot status-unconfigured';
    if (settingsConnText) settingsConnText.textContent = 'Supabase credentials missing from .env';
    if (settingsConnSubtext) {
      settingsConnSubtext.innerHTML = 'Create your local <code>.env</code> file with <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.';
    }
    if (settingsUrl) settingsUrl.textContent = supabaseUrl || 'Missing';
    if (settingsKey) settingsKey.textContent = supabaseKey ? '••••••••' : 'Missing';
    if (settingsAuth) settingsAuth.textContent = 'Unconfigured';

    if (dashBanner) {
      dashBanner.style.backgroundColor = '#fef3c7';
      dashBanner.style.borderColor = '#fde68a';
      dashBanner.style.color = '#92400e';
    }
    if (dashIcon) dashIcon.textContent = '⚠️';
    if (dashBody) {
      dashBody.innerHTML = '<strong>Supabase Cloud Database Not Linked:</strong> Create a <code>.env</code> file from <code>.env.example</code> with your project URL and public key. Visit the <a href="#settings" style="text-decoration: underline; font-weight: 600;">Settings</a> tab for instructions.';
    }
  } else if (!currentUser) {
    // 2. Configured, but coach is not signed in
    if (headerPillDot) headerPillDot.className = 'status-dot status-connected';
    if (headerPillLabel) headerPillLabel.textContent = 'Cloud DB: Ready (Signed Out)';

    if (systemStatusDot) systemStatusDot.className = 'status-dot status-unconfigured';
    if (systemStatusText) systemStatusText.textContent = 'Coach Signed Out';

    if (userDisplayName) userDisplayName.textContent = 'Coach Account';
    if (userAuthStatus) userAuthStatus.textContent = 'Sign In to Sync';
    if (userAvatar) userAvatar.textContent = '🔒';
    if (btnAuthLabel) btnAuthLabel.textContent = 'Sign In';

    if (settingsDot) settingsDot.className = 'status-dot status-connected';
    if (settingsConnText) settingsConnText.textContent = 'Connected to Supabase (Signed out)';
    if (settingsConnSubtext) {
      settingsConnSubtext.textContent = 'API keys verified. Sign in with your coach credentials to access protected records.';
    }
    if (settingsUrl) settingsUrl.textContent = supabaseUrl;
    if (settingsKey) settingsKey.textContent = `${supabaseKey.substring(0, 12)}...`;
    if (settingsAuth) settingsAuth.textContent = 'Signed out';

    if (dashBanner) {
      dashBanner.style.backgroundColor = '#e0f2fe';
      dashBanner.style.borderColor = '#bae6fd';
      dashBanner.style.color = '#0369a1';
    }
    if (dashIcon) dashIcon.textContent = '🔑';
    if (dashBody) {
      dashBody.innerHTML = '<strong>Supabase Connected:</strong> Click <strong>Sign In</strong> in the top right to authenticate your coach session. Row Level Security requires authentication to read and write student data.';
    }
  } else {
    // 3. Fully configured and signed in!
    const email = currentUser.email || 'Coach';
    const initials = email.substring(0, 2).toUpperCase();

    if (headerPillDot) headerPillDot.className = 'status-dot status-connected';
    if (headerPillLabel) headerPillLabel.textContent = 'Cloud DB: Synchronised';

    if (systemStatusDot) systemStatusDot.className = 'status-dot status-connected';
    if (systemStatusText) systemStatusText.textContent = 'Authenticated & Active';

    if (userDisplayName) userDisplayName.textContent = email.split('@')[0];
    if (userAuthStatus) userAuthStatus.textContent = 'Coach (Owner)';
    if (userAvatar) userAvatar.textContent = initials;
    if (btnAuthLabel) btnAuthLabel.textContent = 'Sign Out';

    if (settingsDot) settingsDot.className = 'status-dot status-connected';
    if (settingsConnText) settingsConnText.textContent = 'Active & Authenticated';
    if (settingsConnSubtext) {
      settingsConnSubtext.textContent = `Signed in as ${email}. RLS policies are enforcing access control.`;
    }
    if (settingsUrl) settingsUrl.textContent = supabaseUrl;
    if (settingsKey) settingsKey.textContent = `${supabaseKey.substring(0, 12)}...`;
    if (settingsAuth) settingsAuth.textContent = `Signed in (${email})`;

    if (dashBanner) {
      dashBanner.style.backgroundColor = '#ecfdf5';
      dashBanner.style.borderColor = '#a7f3d0';
      dashBanner.style.color = '#065f46';
    }
    if (dashIcon) dashIcon.textContent = '✅';
    if (dashBody) {
      dashBody.innerHTML = `<strong>Connected &amp; Authenticated:</strong> Signed in as <code>${email}</code>. In Phase 3, you can start managing live student records.`;
    }
  }
}

/**
 * Auth Modal handling
 */
function openAuthModal() {
  if (!isSupabaseConfigured) {
    window.location.hash = '#settings';
    alert(
      'Supabase Configuration Required:\n\n' +
      'Please create a .env file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.\n' +
      'See the Settings page for full step-by-step instructions.'
    );
    return;
  }

  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  const feedback = document.getElementById('auth-feedback');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  if (feedback) {
    feedback.style.display = 'none';
    feedback.textContent = '';
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const titleEl = document.getElementById('auth-modal-title');
  const descEl = document.getElementById('auth-modal-desc');
  const submitBtn = document.getElementById('btn-submit-auth');
  const togglePrompt = document.getElementById('auth-toggle-prompt');
  const toggleBtn = document.getElementById('btn-toggle-auth-mode');

  if (authMode === 'signup') {
    if (titleEl) titleEl.textContent = 'Create Coach Account';
    if (descEl) descEl.textContent = 'Register your initial coach credentials to secure your padel student records.';
    if (submitBtn) submitBtn.textContent = 'Create Account';
    if (togglePrompt) togglePrompt.textContent = 'Already have an account?';
    if (toggleBtn) toggleBtn.textContent = 'Sign In';
  } else {
    if (titleEl) titleEl.textContent = 'Coach Account Sign In';
    if (descEl) descEl.textContent = 'Sign in to synchronise your student roster and coaching groups across your devices.';
    if (submitBtn) submitBtn.textContent = 'Sign In';
    if (togglePrompt) togglePrompt.textContent = 'First time setting up your account?';
    if (toggleBtn) toggleBtn.textContent = 'Create coach account';
  }
}

function showAuthFeedback(message, isError = false) {
  const feedback = document.getElementById('auth-feedback');
  if (feedback) {
    feedback.style.display = 'block';
    feedback.className = `auth-feedback ${isError ? 'error' : 'success'}`;
    feedback.textContent = message;
  }
}

/**
 * Setup interactive buttons, forms, and tabs
 */
function setupEventHandlers() {
  // Top-bar Auth button (Sign In / Sign Out)
  const authActionBtn = document.getElementById('btn-auth-action');
  if (authActionBtn) {
    authActionBtn.addEventListener('click', async () => {
      if (currentUser) {
        // User is logged in -> Sign Out
        const { error } = await signOut();
        if (error) {
          alert(`Sign out error: ${error.message}`);
        }
      } else {
        // User is logged out -> Open Sign In Modal
        setAuthMode('signin');
        openAuthModal();
      }
    });
  }

  // Auth Modal close button & backdrop click
  const closeAuthBtn = document.getElementById('close-auth-modal-btn');
  const authModal = document.getElementById('auth-modal');
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Toggle between Sign In and Sign Up
  const toggleAuthBtn = document.getElementById('btn-toggle-auth-mode');
  if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', () => {
      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    });
  }

  // Auth Form Submission
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const submitBtn = document.getElementById('btn-submit-auth');

      if (!email || !password) {
        showAuthFeedback('Please enter both email and password.', true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';

      try {
        if (authMode === 'signup') {
          const { data, error } = await signUp(email, password);
          if (error) throw error;
          showAuthFeedback('Account created! Check your email if email confirmation is enabled, or sign in now.', false);
        } else {
          const { data, error } = await signIn(email, password);
          if (error) throw error;
          showAuthFeedback('Signed in successfully!', false);
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        }
      } catch (err) {
        showAuthFeedback(err.message || 'Authentication failed. Please check your credentials.', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = authMode === 'signup' ? 'Create Account' : 'Sign In';
      }
    });
  }

  // Quick Action: Add Student button in header
  const addStudentBtn = document.getElementById('btn-add-student');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
      window.location.hash = '#students';
      if (!isSupabaseConfigured) {
        alert(
          'Phase 2 in progress:\n\n' +
          'Please configure your Supabase cloud credentials first.\n' +
          'Visit the Settings tab for guidance.'
        );
      } else if (!currentUser) {
        alert(
          'Authentication Required:\n\n' +
          'Please sign in to your coach account before managing student records.'
        );
        openAuthModal();
      } else {
        alert(
          'Database Connected & Authenticated!\n\n' +
          'In Phase 3, this button will open the live student creation form to insert records into your PostgreSQL database.'
        );
      }
    });
  }

  // Quick Action: Find Match in header
  const quickFilterBtn = document.getElementById('btn-quick-filter');
  if (quickFilterBtn) {
    quickFilterBtn.addEventListener('click', () => {
      window.location.hash = '#find-players';
    });
  }

  // Student directory tabs (Active vs Archived)
  const tabActive = document.getElementById('tab-active-students');
  const tabArchived = document.getElementById('tab-archived-students');

  if (tabActive && tabArchived) {
    tabActive.addEventListener('click', () => {
      tabActive.classList.add('active');
      tabArchived.classList.remove('active');
    });

    tabArchived.addEventListener('click', () => {
      tabArchived.classList.add('active');
      tabActive.classList.remove('active');
    });
  }

  // Search input mock feedback
  const searchInput = document.getElementById('student-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#students-table-body tr');
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

/**
 * Initialize application and Supabase session listener
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupMobileMenu();
  setupEventHandlers();

  // Listen for hash changes in URL
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  // Initialize Auth state
  if (isSupabaseConfigured) {
    try {
      const { data } = await getSession();
      currentUser = data?.session?.user || null;
    } catch (err) {
      console.warn('Failed to retrieve initial session:', err);
      currentUser = null;
    }

    // Subscribe to auth state updates
    onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      updateConnectionUI();
      console.log(`🔐 Supabase Auth Event: ${event}`, currentUser?.email);
    });
  }

  // Initial UI refresh
  updateConnectionUI();

  console.log('🎾 Padel Coach CRM Initialised (Phase 2: Supabase Integration)');
});
