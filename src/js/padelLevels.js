/**
 * Padel Levels Management Module
 * 
 * Defines the standard Padel Rating System:
 * - Levels: 1.00 to 7.00 with 0.25 increments (25 distinct ratings)
 * - Categories: Beginner, Improver, Intermediate, Upper Intermediate, Advanced, Semi-Pro, Elite
 * - Supports in-browser editing and localStorage persistence
 */

const STORAGE_KEY = 'padel_crm_padel_levels';

/**
 * Builds the default 25 rating levels from 1.00 to 7.00 (step: 0.25)
 * @returns {Array} Array of level rating objects
 */
export function generateDefaultLevels() {
  const levels = [];
  for (let val = 1.0; val <= 7.001; val += 0.25) {
    const fixed = val.toFixed(2);
    const num = parseFloat(fixed);
    let category = '';
    let description = '';

    if (num < 2.0) {
      category = 'Beginner';
      description = num === 1.00
        ? 'First steps on court, learning continental grip and basic ball contact.'
        : `Developing baseline ball control and short rally consistency (${fixed}).`;
    } else if (num < 3.0) {
      category = 'Improver';
      description = num === 2.00
        ? 'Can sustain short groundstroke rallies; beginning to read back-glass rebounds.'
        : `Improving back-glass defence and net volley positioning confidence (${fixed}).`;
    } else if (num < 4.0) {
      category = 'Intermediate';
      description = num === 3.00
        ? 'Consistent net volleys and reliable lobs; comfortable defending off the back wall.'
        : `Developing transition play, defensive chiquitas, and overhead bandejas (${fixed}).`;
    } else if (num < 5.0) {
      category = 'Upper Intermediate';
      description = num === 4.00
        ? 'Confident with double-glass corner rebounds, deep volleys, and strategic point play.'
        : `Fast-paced tactical decision making, effective víbora and bajada de pared (${fixed}).`;
    } else if (num < 6.0) {
      category = 'Advanced';
      description = num === 5.00
        ? 'Regional tournament competitor; high-speed defence, heavy spin control, and smash power.'
        : `Mastery of aggressive counter-attacks and dominant court coverage (${fixed}).`;
    } else if (num < 7.0) {
      category = 'Semi-Pro';
      description = 'National ranking contender; exceptional technical accuracy under pressure.';
    } else {
      category = 'Professional / Elite';
      description = 'Top tier national/international tour player (Premier Padel / FIP).';
    }

    levels.push({
      level: num,
      levelStr: fixed,
      category,
      description,
      status: 'Active'
    });
  }
  return levels;
}

let activeEditingLevelStr = null;
let currentCategoryFilter = 'all';

/**
 * Returns the active padel levels from localStorage or defaults
 * @returns {Array}
 */
export function getPadelLevels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not read padel levels from storage:', err);
  }
  return generateDefaultLevels();
}

/**
 * Updates a specific padel level rating
 * @param {string} levelStr - e.g. '2.25'
 * @param {Object} updates - { category, description }
 * @returns {Array}
 */
export function updatePadelLevel(levelStr, updates) {
  const current = getPadelLevels();
  const index = current.findIndex((l) => l.levelStr === levelStr);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.warn('Could not save padel levels to storage:', err);
    }
  }
  return current;
}

/**
 * Dynamically renders the Padel Levels table with category filtering and inline editing
 */
export function initPadelLevelsUI() {
  const tableBody = document.getElementById('padel-levels-table-body');
  const countBadge = document.getElementById('padel-levels-count-badge');
  const filterSelect = document.getElementById('filter-levels-category');

  if (!tableBody) return;

  function render() {
    const allLevels = getPadelLevels();
    const filtered = currentCategoryFilter === 'all'
      ? allLevels
      : allLevels.filter((l) => l.category.toLowerCase().includes(currentCategoryFilter.toLowerCase()));

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Levels shown`;
    }

    tableBody.innerHTML = filtered
      .map((l) => {
        const isEditing = activeEditingLevelStr === l.levelStr;
        const safeId = l.levelStr.replace('.', '_');

        if (isEditing) {
          return `
            <tr style="background-color: var(--accent-50);">
              <td>
                <span class="level-pill" style="font-size: 0.95rem; padding: 0.3rem 0.65rem;">
                  ${l.levelStr}
                </span>
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-level-cat-${safeId}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; max-width: 170px; font-weight: 600;" 
                  value="${l.category}" 
                  placeholder="Category..."
                  aria-label="Category for level ${l.levelStr}"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-level-desc-${safeId}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; width: 100%;" 
                  value="${l.description}" 
                  placeholder="Key competencies..."
                  aria-label="Description for level ${l.levelStr}"
                />
              </td>
              <td><span class="badge badge-status-occasional">Editing</span></td>
              <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-sm btn-primary btn-save-level" data-level="${l.levelStr}">
                  💾 Save
                </button>
                <button class="btn btn-sm btn-secondary btn-cancel-level" style="margin-left: 0.35rem;">
                  Cancel
                </button>
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td>
              <span class="level-pill" style="font-size: 0.95rem; padding: 0.25rem 0.6rem;">
                ${l.levelStr}
              </span>
            </td>
            <td><strong>${l.category}</strong></td>
            <td class="text-muted">${l.description}</td>
            <td><span class="badge badge-status-active">${l.status}</span></td>
            <td class="text-right">
              <button class="btn btn-sm btn-secondary btn-edit-level" data-level="${l.levelStr}" title="Edit level ${l.levelStr}">
                ✏️ Edit
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach click listeners for inline editing
    tableBody.querySelectorAll('.btn-edit-level').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const levelStr = e.currentTarget.dataset.level;
        activeEditingLevelStr = levelStr;
        render();

        const safeId = levelStr.replace('.', '_');
        setTimeout(() => {
          const input = document.getElementById(`input-level-desc-${safeId}`);
          if (input) input.focus();
        }, 50);
      });
    });

    tableBody.querySelectorAll('.btn-save-level').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const levelStr = e.currentTarget.dataset.level;
        const safeId = levelStr.replace('.', '_');
        const catInput = document.getElementById(`input-level-cat-${safeId}`);
        const descInput = document.getElementById(`input-level-desc-${safeId}`);

        if (catInput && descInput) {
          const newCat = catInput.value.trim();
          const newDesc = descInput.value.trim();

          if (!newCat) {
            alert('Category cannot be empty.');
            return;
          }

          updatePadelLevel(levelStr, {
            category: newCat,
            description: newDesc
          });
        }

        activeEditingLevelStr = null;
        render();
      });
    });

    tableBody.querySelectorAll('.btn-cancel-level').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeEditingLevelStr = null;
        render();
      });
    });
  }

  // Category filter dropdown listener
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      activeEditingLevelStr = null;
      render();
    });
  }

  // Initial render
  render();
}
