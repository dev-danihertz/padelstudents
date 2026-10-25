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
 * - Local fallback and cache, synchronised with Supabase when configured
 */
import { supabase as defaultSupabase, isSupabaseConfigured as defaultSupabaseConfigured } from './supabaseClient.js';

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
export function initLessonThemesUI(options = {}) {
  const supabase = options.supabase || defaultSupabase;
  const isConfigured = options.isSupabaseConfigured ?? defaultSupabaseConfigured;
  const getCurrentUser = options.getCurrentUser || (() => null);
  const tableBody = document.getElementById('lesson-themes-table-body');
  const countBadge = document.getElementById('lesson-themes-count-badge');
  const feedback = document.getElementById('lesson-themes-feedback');
  const searchInput = document.getElementById('search-lesson-themes');
  const toggleAddBtn = document.getElementById('btn-toggle-add-theme');
  const addPanel = document.getElementById('add-theme-form-panel');
  const addForm = document.getElementById('form-create-theme');
  const cancelAddBtn = document.getElementById('btn-cancel-add-theme');
  let themes = getLessonThemes();

  if (!tableBody) return;

  const hasCloudSession = () => Boolean(isConfigured && getCurrentUser()?.id);

  function showFeedback(message, isError = false) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.style.color = isError ? '#991b1b' : '#1e3a8a';
    feedback.style.backgroundColor = isError ? '#fee2e2' : '#dbeafe';
    feedback.style.display = message ? 'block' : 'none';
  }

  async function refresh() {
    if (!hasCloudSession()) {
      themes = getLessonThemes();
      render();
      return themes;
    }

    const selectThemes = () => supabase.from('lesson_themes')
      .select('id, name, description, status, sort_order, user_id')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name');
    let { data, error } = await selectThemes();
    if (error) {
      console.error('Could not load lesson themes from Supabase:', error);
      showFeedback(`Unable to load themes from Supabase.\n${error.message || JSON.stringify(error)}`, true);
      return themes;
    }

    const localThemes = getLessonThemes();
    const knownNames = new Set((data || []).map((theme) => theme.name.trim().toLowerCase()));
    let nextOrder = Math.max(0, ...(data || []).map((theme) => Number(theme.sort_order) || 0)) + 1;
    const userId = getCurrentUser().id;
    for (const theme of localThemes.filter((item) => String(item.id).startsWith('theme-'))) {
      const normalizedName = theme.name.trim().toLowerCase();
      const defaultTheme = DEFAULT_LESSON_THEMES.find((item) => item.id === theme.id);
      if (defaultTheme && theme.name.trim() !== defaultTheme.name) {
        const originalTheme = (data || []).find((item) => item.name.trim().toLowerCase() === defaultTheme.name.toLowerCase());
        if (originalTheme) {
          const { data: renamedTheme, error: renameError } = await supabase.from('lesson_themes')
            .update({
              name: theme.name.trim(),
              description: theme.description || '',
              status: theme.status || 'Active'
            })
            .eq('id', originalTheme.id)
            .select('id, name, description, status, sort_order, user_id')
            .single();
          if (!renameError) {
            data = (data || []).map((item) => item.id === renamedTheme.id ? renamedTheme : item);
            knownNames.delete(defaultTheme.name.toLowerCase());
            knownNames.add(normalizedName);
            continue;
          }
          console.error('Could not sync a renamed default theme to Supabase:', renameError);
        }
      }
      if (knownNames.has(normalizedName)) continue;
      const { error: insertError } = await supabase.from('lesson_themes').insert({
        name: theme.name.trim(),
        description: theme.description || '',
        status: theme.status || 'Active',
        user_id: userId,
        sort_order: nextOrder
      });
      if (insertError) {
        console.error('Could not sync a locally saved lesson theme to Supabase:', insertError);
        continue;
      }
      knownNames.add(normalizedName);
      nextOrder += 1;
    }

    ({ data, error } = await selectThemes());
    if (error) {
      console.error('Could not refresh lesson themes from Supabase:', error);
      showFeedback(`Unable to refresh themes from Supabase.\n${error.message || JSON.stringify(error)}`, true);
      return themes;
    }
    themes = data || [];
    saveLessonThemes(themes);
    render();
    return themes;
  }

  async function createTheme(themeData) {
    if (!isConfigured) {
      themes = addLessonTheme(themeData);
      render();
      return true;
    }
    if (!hasCloudSession()) {
      alert('Sign in to your coach account before saving lesson themes.');
      return false;
    }
    const nextOrder = Math.max(0, ...themes.map((theme) => Number(theme.sort_order) || 0)) + 1;
    const { data, error } = await supabase.from('lesson_themes').insert({
      ...themeData,
      user_id: getCurrentUser().id,
      sort_order: nextOrder
    }).select('id, name, description, status, sort_order, user_id').single();
    if (error) {
      alert(`Could not save this lesson theme: ${error.message}`);
      return false;
    }
    themes = [...themes, data];
    saveLessonThemes(themes);
    render();
    return true;
  }

  async function updateTheme(id, updates) {
    if (!isConfigured) {
      themes = updateLessonTheme(id, updates);
      render();
      return true;
    }
    if (!hasCloudSession()) {
      alert('Sign in to your coach account before editing lesson themes.');
      return false;
    }
    const { data, error } = await supabase.from('lesson_themes').update(updates)
      .eq('id', id).select('id, name, description, status, sort_order, user_id').single();
    if (error) {
      alert(`Could not update this lesson theme: ${error.message}`);
      return false;
    }
    themes = themes.map((theme) => theme.id === id ? data : theme);
    saveLessonThemes(themes);
    render();
    return true;
  }

  async function removeTheme(id) {
    if (!isConfigured) {
      themes = deleteLessonTheme(id);
      render();
      return true;
    }
    if (!hasCloudSession()) {
      alert('Sign in to your coach account before deleting lesson themes.');
      return false;
    }
    const { error } = await supabase.from('lesson_themes').delete().eq('id', id);
    if (error) {
      alert(`Could not delete this lesson theme: ${error.message}`);
      return false;
    }
    themes = themes.filter((theme) => theme.id !== id);
    saveLessonThemes(themes);
    render();
    return true;
  }

  async function moveTheme(id, direction, visibleThemeIds) {
    showFeedback(`Arrow click received.\nTheme ID: ${id}\nDirection: ${direction}\nSaving order…`);
    if (!isConfigured) {
      themes = moveLessonTheme(id, direction, visibleThemeIds);
      render();
      showFeedback('Theme order updated.');
      return true;
    }
    if (!hasCloudSession()) {
      showFeedback('Sign in to your coach account before reordering lesson themes.', true);
      return false;
    }
    try {
      await refresh();
      const term = currentSearchTerm.toLowerCase();
      const currentVisibleIds = themes.filter((theme) =>
        !term || String(theme.name || '').toLowerCase().includes(term) || String(theme.description || '').toLowerCase().includes(term)
      ).map((theme) => theme.id);
      const visibleIndex = currentVisibleIds.indexOf(id);
      const targetId = currentVisibleIds[visibleIndex + direction];
      showFeedback(`Arrow click received.\nTheme ID: ${id}\nDirection: ${direction}\nVisible themes loaded: ${currentVisibleIds.length}\nCurrent position: ${visibleIndex + 1}\nTarget ID: ${targetId || '(none)'}`);
      if (visibleIndex < 0) {
        showFeedback('The theme list changed. It has been refreshed; please click the arrow again.', true);
        return false;
      }
      if (!targetId) {
        showFeedback('This theme is already at the edge of the displayed list.');
        return false;
      }
      const reordered = [...themes];
      const currentIndex = reordered.findIndex((theme) => theme.id === id);
      const targetIndex = reordered.findIndex((theme) => theme.id === targetId);
      if (currentIndex < 0 || targetIndex < 0) {
        showFeedback('The theme list changed. It has been refreshed; please click the arrow again.', true);
        return false;
      }
      [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
      for (let index = 0; index < reordered.length; index += 1) {
        const { data, error } = await supabase.from('lesson_themes')
          .update({ sort_order: index + 1 })
          .eq('id', reordered[index].id)
          .select('id')
          .maybeSingle();
        if (error || !data) {
          await refresh();
          showFeedback(`Could not save the new order.\nDatabase error: ${error?.message || '(none)'}\nUpdated row returned: ${data?.id || '(none)'}\nTheme being updated: ${reordered[index].id}`, true);
          return false;
        }
      }
      themes = reordered.map((theme, index) => ({ ...theme, sort_order: index + 1 }));
      saveLessonThemes(themes);
      render();
      showFeedback(`Theme order saved successfully.\nMoved theme: ${id}\nDirection: ${direction}\nRows updated: ${reordered.length}`);
      return true;
    } catch (error) {
      console.error('Could not reorder lesson themes:', error);
      showFeedback(`Unexpected error while reordering.\n${error?.message || String(error)}\n${error?.details || ''}\n${error?.hint || ''}`, true);
      return false;
    }
  }

  function render() {
    const allThemes = themes;

    // Apply filtering
    let filtered = allThemes.filter((theme) => {
      const term = currentSearchTerm.toLowerCase();
      const matchesSearch = !term ||
        String(theme.name || '').toLowerCase().includes(term) ||
        String(theme.description || '').toLowerCase().includes(term);

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
              <td class="theme-order-cell">#${orderNumber}</td>
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
            <td class="theme-order-cell">#${orderNumber}</td>
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
              <button type="button" class="btn btn-sm btn-secondary btn-move-theme" data-id="${theme.id}" data-direction="-1" aria-label="Move ${escapeHtml(theme.name)} up" title="Move up" ${filteredIndex === 0 ? 'disabled' : ''}>
                ↑
              </button>
              <button type="button" class="btn btn-sm btn-secondary btn-move-theme" data-id="${theme.id}" data-direction="1" aria-label="Move ${escapeHtml(theme.name)} down" title="Move down" ${filteredIndex === filtered.length - 1 ? 'disabled' : ''}>
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
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.disabled = true;
        const { id, direction } = e.currentTarget.dataset;
        showFeedback(`Button handler ran.\nTheme ID: ${id}\nDirection: ${direction}\nStarting reorder…`);
        try {
          await moveTheme(id, Number(direction), visibleThemeIds);
        } finally {
          // render() replaces the row buttons after a successful move.
          if (btn.isConnected) btn.disabled = false;
        }
      });
    });

    // Wire up inline edit buttons
    tableBody.querySelectorAll('.btn-edit-theme').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
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
      btn.addEventListener('click', async (e) => {
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

          const updated = await updateTheme(id, {
            name: newName,
            description: newDesc,
            status: newStatus
          });
          if (!updated) return;
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
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;

        const confirmMsg = `Are you sure you want to delete the theme "${name}"?\nThis action will remove it from your available coaching themes.`;
        if (window.confirm(confirmMsg)) {
          const deleted = await removeTheme(id);
          if (!deleted) return;
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
    addForm.addEventListener('submit', async (e) => {
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

      const created = await createTheme({
        name,
        description,
        status
      });
      if (!created) return;

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
  return { refresh };
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
