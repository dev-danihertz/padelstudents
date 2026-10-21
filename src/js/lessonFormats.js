/**
 * Lesson Formats Management Module
 * 
 * Defines the coaching lesson format options:
 * - 1:1  (Individual Private)
 * - 1:2  (Semi-Private / Pair)
 * - 1:3  (Trio Coaching Group)
 * - 1:4  (Full Quad Group)
 * - 1:5+ (Large Group / Clinic / Workshop)
 * 
 * Supports in-browser editing with localStorage persistence.
 */

export const DEFAULT_LESSON_FORMATS = [
  {
    id: '1:1',
    code: '1:1',
    name: 'Individual Private',
    maxStudents: '1 student',
    description: 'Dedicated 1-on-1 technical focus, biomechanics, and personalized drill work.',
    status: 'Active'
  },
  {
    id: '1:2',
    code: '1:2',
    name: 'Semi-Private (Pair)',
    maxStudents: '2 students',
    description: 'Pair tactical positioning, wall defence communication, and doubles strategy.',
    status: 'Active'
  },
  {
    id: '1:3',
    code: '1:3',
    name: 'Trio Coaching Group',
    maxStudents: '3 students',
    description: 'High-tempo rotational drills, 2-vs-1 attacking patterns, and transition play.',
    status: 'Active'
  },
  {
    id: '1:4',
    code: '1:4',
    name: 'Full Quad Group',
    maxStudents: '4 students',
    description: 'Full-court matchplay simulation, set-piece tactics, and point-construction.',
    status: 'Active'
  },
  {
    id: '1:5+',
    code: '1:5+',
    name: 'Large Group & Clinic',
    maxStudents: '5+ students',
    description: 'Cardio padel, club social clinics, workshops, and multi-court team sessions.',
    status: 'Active'
  }
];

const STORAGE_KEY = 'padel_crm_lesson_formats';

let activeEditingFormatId = null;

/**
 * Returns the active lesson formats from localStorage or defaults
 * @returns {Array} Array of lesson format objects
 */
export function getLessonFormats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not read lesson formats from storage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_LESSON_FORMATS));
}

/**
 * Updates a specific lesson format in storage
 * @param {string} id - e.g. '1:1', '1:2', '1:5+'
 * @param {Object} updates - { name, description, maxStudents }
 * @returns {Array}
 */
export function updateLessonFormat(id, updates) {
  const current = getLessonFormats();
  const index = current.findIndex((f) => f.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.warn('Could not save lesson formats to storage:', err);
    }
  }
  return current;
}

/**
 * Dynamically renders the Lesson Formats Table and wires up inline editing
 */
export function initLessonFormatsUI() {
  const tableBody = document.getElementById('lesson-formats-table-body');
  if (!tableBody) return;

  function render() {
    const formats = getLessonFormats();

    tableBody.innerHTML = formats
      .map((f) => {
        const isEditing = activeEditingFormatId === f.id;
        if (isEditing) {
          return `
            <tr style="background-color: var(--accent-50);">
              <td>
                <span class="tag" style="font-weight: 700; font-size: 0.85rem; background-color: var(--accent-100); color: var(--accent-600); padding: 0.25rem 0.6rem;">
                  ${f.code}
                </span>
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-format-name-${f.id.replace('+', '_plus').replace(':', '_')}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; max-width: 180px; font-weight: 600;" 
                  value="${f.name}"
                  aria-label="Format name"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-format-capacity-${f.id.replace('+', '_plus').replace(':', '_')}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; max-width: 120px;" 
                  value="${f.maxStudents}"
                  aria-label="Student capacity"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-format-desc-${f.id.replace('+', '_plus').replace(':', '_')}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; width: 100%;" 
                  value="${f.description}"
                  aria-label="Format description"
                />
              </td>
              <td><span class="badge badge-status-occasional">Editing</span></td>
              <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-sm btn-primary btn-save-format" data-id="${f.id}">
                  💾 Save
                </button>
                <button class="btn btn-sm btn-secondary btn-cancel-format" style="margin-left: 0.35rem;">
                  Cancel
                </button>
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td>
              <span class="tag" style="font-weight: 700; font-size: 0.85rem; background-color: var(--border-subtle); color: var(--primary-900); padding: 0.25rem 0.6rem;">
                ${f.code}
              </span>
            </td>
            <td><strong>${f.name}</strong></td>
            <td><span class="badge badge-non-member">${f.maxStudents}</span></td>
            <td class="text-muted">${f.description}</td>
            <td><span class="badge badge-status-active">${f.status}</span></td>
            <td class="text-right">
              <button class="btn btn-sm btn-secondary btn-edit-format" data-id="${f.id}" title="Edit format ${f.code}">
                ✏️ Edit
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach Click Listeners
    tableBody.querySelectorAll('.btn-edit-format').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        activeEditingFormatId = id;
        render();

        const safeId = id.replace('+', '_plus').replace(':', '_');
        setTimeout(() => {
          const input = document.getElementById(`input-format-name-${safeId}`);
          if (input) input.focus();
        }, 50);
      });
    });

    tableBody.querySelectorAll('.btn-save-format').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const safeId = id.replace('+', '_plus').replace(':', '_');
        const nameInput = document.getElementById(`input-format-name-${safeId}`);
        const capacityInput = document.getElementById(`input-format-capacity-${safeId}`);
        const descInput = document.getElementById(`input-format-desc-${safeId}`);

        if (nameInput && descInput && capacityInput) {
          const newName = nameInput.value.trim();
          const newCapacity = capacityInput.value.trim();
          const newDesc = descInput.value.trim();

          if (!newName) {
            alert('Format name cannot be empty.');
            return;
          }

          updateLessonFormat(id, {
            name: newName,
            maxStudents: newCapacity,
            description: newDesc
          });
        }

        activeEditingFormatId = null;
        render();
      });
    });

    tableBody.querySelectorAll('.btn-cancel-format').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeEditingFormatId = null;
        render();
      });
    });
  }

  // Initial render
  render();
}
