/**
 * Padel Coach CRM - Main Application Logic (Vanilla JavaScript)
 * 
 * In this Phase 1 foundation:
 * 1. Simple hash-based client-side router (switches views without page reloads).
 * 2. Mobile drawer navigation toggling.
 * 3. User interface state management for tabs and quick actions.
 */

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
  settings: {
    title: 'Settings',
    subtitle: 'Configure coaching parameters and system settings.'
  }
};

/**
 * Switch the active view based on the given view identifier
 * @param {string} viewId - e.g., 'dashboard', 'students', 'find-players'
 */
function navigateTo(viewId) {
  // If view does not exist, fall back to dashboard
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
 * Setup interactive buttons and tab controls
 */
function setupEventHandlers() {
  // Quick Action: Add Student button in header
  const addStudentBtn = document.getElementById('btn-add-student');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
      // Navigate to students view
      window.location.hash = '#students';
      alert(
        'Student Creation Ready for Phase 3:\n\n' +
        'In Phase 2, we will configure the Supabase database schema and Row Level Security.\n' +
        'In Phase 3, clicking this button will open the full student registration form!'
      );
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
 * Initialise application on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupEventHandlers();

  // Listen for hash changes in URL
  window.addEventListener('hashchange', handleHashChange);

  // Trigger initial route
  handleHashChange();

  console.log('🎾 Padel Coach CRM Initialised (Phase 1: Project Foundation)');
});
