/**
 * Lesson Themes (Temas de Aula) Management Module
 * 
 * Manages coaching lesson curriculum topics:
 * - Double Glass (Saída de dupla parede)
 * - Overhead (Bandeja, Víbora, Smash)
 * - Volley (Voleios de rede)
 * - Back Glass (Saída de parede de fundo)
 * - Lob (Globos de defesa e transição)
 * 
 * Supports:
 * - Inserir novo tema (Create)
 * - Alterar tema existente (Update / Inline Edit)
 * - Excluir tema (Delete with confirmation)
 * - Search themes in real time
 * - Persistência completa no localStorage
 */

export const DEFAULT_LESSON_THEMES = [
  {
    id: 'theme-double-glass',
    name: 'Double Glass',
    description: 'Reading side-to-back and back-to-side rebounds, corner positioning, body rotation, and counter-attacks.',
    status: 'Active'
  },
  {
    id: 'theme-overhead',
    name: 'Overhead',
    description: 'Mastery of bandeja, víbora, kick smash, and flat smash: footwork, contact point, depth, and placement.',
    status: 'Active'
  },
  {
    id: 'theme-volley',
    name: 'Volley',
    description: 'Forehand and backhand net volleys, low contact blocking, punch volleys, depth control, and footwork.',
    status: 'Active'
  },
  {
    id: 'theme-back-glass',
    name: 'Back Glass',
    description: 'Reading deep balls off the rear wall, timing the bounce, proper spacing, defensive lobs, and bajadas.',
    status: 'Active'
  },
  {
    id: 'theme-lob',
    name: 'Lob',
    description: 'Defensive lob height and trajectory to reset points, push opponents off the net, and reclaim court position.',
    status: 'Active'
  }
];

const STORAGE_KEY = 'padel_crm_lesson_themes';

let activeEditingThemeId = null;
let currentSearchTerm = '';

/**
 * Returns the list of themes from localStorage or fallback to defaults
 * @returns {Array} Array of theme objects
 */
export function getLessonThemes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const themesWithoutCategory = parsed.map(({ category, ...theme }) => theme);
        if (themesWithoutCategory.some((theme, index) => Object.hasOwn(parsed[index], 'category'))) {
          saveLessonThemes(themesWithoutCategory);
        }
        return themesWithoutCategory;
      }
    }
  } catch (err) {
    console.warn('Could not read lesson themes from storage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_LESSON_THEMES));
}

/**
 * Persists themes list to localStorage
 * @param {Array} themes
 */
export function saveLessonThemes(themes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  } catch (err) {
    console.error('Could not save lesson themes to storage:', err);
  }
}

/**
 * Inserts a new lesson theme
 * @param {Object} themeData - { name, description, status }
 * @returns {Array} Updated themes array
 */
export function addLessonTheme(themeData) {
  const themes = getLessonThemes();
  const id = 'theme-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  const newTheme = {
    id,
    name: themeData.name.trim(),
    description: (themeData.description || '').trim(),
    status: themeData.status || 'Active'
  };

  themes.push(newTheme);
  saveLessonThemes(themes);
  return themes;
}

/**
 * Updates an existing lesson theme
 * @param {string} id
 * @param {Object} updates
 * @returns {Array} Updated themes array
 */
export function updateLessonTheme(id, updates) {
  const themes = getLessonThemes();
  const index = themes.findIndex((t) => t.id === id);
  if (index !== -1) {
    themes[index] = { ...themes[index], ...updates };
    saveLessonThemes(themes);
  }
  return themes;
}

/** Moves a theme one position within the currently visible order. */
export function moveLessonTheme(id, direction, visibleThemeIds) {
  const themes = getLessonThemes();
  const visibleIndex = visibleThemeIds.indexOf(id);
  const targetVisibleId = visibleThemeIds[visibleIndex + direction];
  if (!targetVisibleId) return themes;

  const currentIndex = themes.findIndex((theme) => theme.id === id);
  const targetIndex = themes.findIndex((theme) => theme.id === targetVisibleId);
  if (currentIndex < 0 || targetIndex < 0) return themes;

  [themes[currentIndex], themes[targetIndex]] = [themes[targetIndex], themes[currentIndex]];
  saveLessonThemes(themes);
  return themes;
}

/**
 * Deletes a lesson theme by id
 * @param {string} id
 * @returns {Array} Updated themes array
 */
export function deleteLessonTheme(id) {
  const themes = getLessonThemes();
  const filtered = themes.filter((t) => t.id !== id);
  saveLessonThemes(filtered);
  return filtered;
}

/**
 * Resets themes to default 5 themes
 * @returns {Array}
 */
export function resetDefaultThemes() {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_LESSON_THEMES));
  saveLessonThemes(defaults);
  return defaults;
}

/**
 * Initialises and wires up the Lesson Themes UI
 */
export function initLessonThemesUI() {
  const tableBody = document.getElementById('lesson-themes-table-body');
  const countBadge = document.getElementById('lesson-themes-count-badge');
  const searchInput = document.getElementById('search-lesson-themes');
  const toggleAddBtn = document.getElementById('btn-toggle-add-theme');
  const addPanel = document.getElementById('add-theme-form-panel');
  const addForm = document.getElementById('form-create-theme');
  const cancelAddBtn = document.getElementById('btn-cancel-add-theme');

  if (!tableBody) return;

  function render() {
    const allThemes = getLessonThemes();

    // Apply filtering
    let filtered = allThemes.filter((theme) => {
      const term = currentSearchTerm.toLowerCase();
      const matchesSearch = !term ||
        theme.name.toLowerCase().includes(term) ||
        theme.description.toLowerCase().includes(term);

      return matchesSearch;
    });

    // Update count badge
    if (countBadge) {
      if (filtered.length === allThemes.length) {
        countBadge.textContent = `${allThemes.length} Theme${allThemes.length !== 1 ? 's' : ''}`;
      } else {
        countBadge.textContent = `${filtered.length} of ${allThemes.length} Themes`;
      }
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No lesson themes found matching your filter.
            <button class="btn btn-sm btn-ghost" id="btn-clear-theme-filters" style="margin-left: 0.5rem;">
              Clear Filters
            </button>
          </td>
        </tr>
      `;

      const clearBtn = document.getElementById('btn-clear-theme-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          currentSearchTerm = '';
          if (searchInput) searchInput.value = '';
          render();
        });
      }
      return;
    }

    tableBody.innerHTML = filtered
      .map((theme, filteredIndex) => {
        const isEditing = activeEditingThemeId === theme.id;
        const safeId = theme.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const orderNumber = allThemes.findIndex((item) => item.id === theme.id) + 1;

        if (isEditing) {
          return `
            <tr style="background-color: var(--accent-50);">
              <td class="theme-order-cell">${orderNumber}</td>
              <td>
                <input 
                  type="text" 
                  id="input-theme-name-${safeId}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.35rem 0.5rem; width: 100%; font-weight: 600;" 
                  value="${escapeHtml(theme.name)}"
                  placeholder="Theme name *"
                  required
                />
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-theme-desc-${safeId}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.35rem 0.5rem; width: 100%;" 
                  value="${escapeHtml(theme.description)}"
                  placeholder="Description & drills focus"
                />
              </td>
              <td>
                <select id="input-theme-status-${safeId}" class="form-select" style="font-size: 0.85rem; padding: 0.35rem 0.5rem; width: 100%;">
                  <option value="Active" ${theme.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Inactive" ${theme.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
              </td>
              <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-sm btn-primary btn-save-theme" data-id="${theme.id}" title="Save theme changes">
                  💾 Save
                </button>
                <button class="btn btn-sm btn-secondary btn-cancel-theme" style="margin-left: 0.35rem;" title="Cancel editing">
                  Cancel
                </button>
              </td>
            </tr>
          `;
        }

        const statusBadgeClass = theme.status === 'Active' ? 'badge-status-active' : 'badge-status-inactive';

        return `
          <tr data-theme-id="${theme.id}">
            <td class="theme-order-cell">${orderNumber}</td>
            <td style="width: 28%;">
              <strong>${escapeHtml(theme.name)}</strong>
            </td>
            <td class="text-muted" style="width: 42%; line-height: 1.45; font-size: 0.875rem;">
              ${escapeHtml(theme.description) || '<em style="color: #94a3b8;">No technical notes provided</em>'}
            </td>
            <td>
              <span class="badge ${statusBadgeClass}">
                ${theme.status}
              </span>
            </td>
            <td class="text-right" style="white-space: nowrap;">
              <button class="btn btn-sm btn-secondary btn-edit-theme" data-id="${theme.id}" title="Edit theme ${escapeHtml(theme.name)}">
                ✏️ Edit
              </button>
              <button class="btn btn-sm btn-secondary btn-move-theme" data-id="${theme.id}" data-direction="-1" aria-label="Move ${escapeHtml(theme.name)} up" title="Move up" ${filteredIndex === 0 ? 'disabled' : ''}>
                ↑
              </button>
              <button class="btn btn-sm btn-secondary btn-move-theme" data-id="${theme.id}" data-direction="1" aria-label="Move ${escapeHtml(theme.name)} down" title="Move down" ${filteredIndex === filtered.length - 1 ? 'disabled' : ''}>
                ↓
              </button>
              <button class="btn btn-sm btn-outline-danger btn-delete-theme" data-id="${theme.id}" data-name="${escapeHtml(theme.name)}" style="margin-left: 0.35rem;" title="Delete theme ${escapeHtml(theme.name)}">
                🗑️ Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    const visibleThemeIds = filtered.map((theme) => theme.id);
    tableBody.querySelectorAll('.btn-move-theme').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const { id, direction } = e.currentTarget.dataset;
        moveLessonTheme(id, Number(direction), visibleThemeIds);
        render();
      });
    });

    // Wire up inline edit buttons
    tableBody.querySelectorAll('.btn-edit-theme').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        activeEditingThemeId = id;
        render();

        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        setTimeout(() => {
          const input = document.getElementById(`input-theme-name-${safeId}`);
          if (input) input.focus();
        }, 50);
      });
    });

    // Wire up save buttons
    tableBody.querySelectorAll('.btn-save-theme').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const nameInput = document.getElementById(`input-theme-name-${safeId}`);
        const descInput = document.getElementById(`input-theme-desc-${safeId}`);
        const statusInput = document.getElementById(`input-theme-status-${safeId}`);

        if (nameInput) {
          const newName = nameInput.value.trim();
          const newDesc = descInput ? descInput.value.trim() : '';
          const newStatus = statusInput ? statusInput.value : 'Active';

          if (!newName) {
            alert('Theme name is required.');
            nameInput.focus();
            return;
          }

          updateLessonTheme(id, {
            name: newName,
            description: newDesc,
            status: newStatus
          });
        }

        activeEditingThemeId = null;
        render();
      });
    });

    // Wire up cancel edit buttons
    tableBody.querySelectorAll('.btn-cancel-theme').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeEditingThemeId = null;
        render();
      });
    });

    // Wire up delete buttons
    tableBody.querySelectorAll('.btn-delete-theme').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;

        const confirmMsg = `Are you sure you want to delete the theme "${name}"?\nThis action will remove it from your available coaching themes.`;
        if (window.confirm(confirmMsg)) {
          deleteLessonTheme(id);
          if (activeEditingThemeId === id) {
            activeEditingThemeId = null;
          }
          render();
        }
      });
    });
  }

  // Hook up Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.trim();
      render();
    });
  }

  // Hook up Toggle Add Form Button
  if (toggleAddBtn && addPanel) {
    toggleAddBtn.addEventListener('click', () => {
      const isVisible = addPanel.style.display !== 'none';
      if (isVisible) {
        addPanel.style.display = 'none';
        toggleAddBtn.innerHTML = '➕ Add New Theme';
      } else {
        addPanel.style.display = 'block';
        toggleAddBtn.innerHTML = '✖️ Close Form';
        const nameField = document.getElementById('new-theme-name');
        if (nameField) {
          setTimeout(() => nameField.focus(), 50);
        }
      }
    });
  }

  // Hook up Cancel Add Form Button
  if (cancelAddBtn && addPanel && toggleAddBtn) {
    cancelAddBtn.addEventListener('click', () => {
      addPanel.style.display = 'none';
      toggleAddBtn.innerHTML = '➕ Add New Theme';
      if (addForm) addForm.reset();
    });
  }

  // Hook up Add Form Submission
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('new-theme-name');
      const descInput = document.getElementById('new-theme-desc');
      const statusInput = document.getElementById('new-theme-status');

      const name = nameInput ? nameInput.value.trim() : '';
      const description = descInput ? descInput.value.trim() : '';
      const status = statusInput ? statusInput.value : 'Active';

      if (!name) {
        alert('Please enter a theme name.');
        if (nameInput) nameInput.focus();
        return;
      }

      addLessonTheme({
        name,
        description,
        status
      });

      // Reset form and close
      addForm.reset();
      if (addPanel) addPanel.style.display = 'none';
      if (toggleAddBtn) toggleAddBtn.innerHTML = '➕ Add New Theme';

      // Render updated list
      render();
    });
  }

  // Initial render
  render();
}

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
