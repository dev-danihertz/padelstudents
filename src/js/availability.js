/**
 * Availability & Schedule Management Module
 * 
 * Defines the core structure of coaching availability:
 * - Days: Weekdays (Monday to Friday) and Weekends (Saturday and Sunday)
 * - Quick-select groups backed by individual 30-minute slots (09:00–20:00)
 * - Client-side in-browser editing with persistent storage
 */

export const DEFAULT_TIME_PERIODS = [
  {
    id: 'morning',
    name: 'Morning',
    timeWindow: '09:00 – 12:00',
    description: 'Early morning & mid-morning coaching sessions, drills and clinics',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'midday',
    name: 'Midday',
    timeWindow: '12:00 – 14:00',
    description: 'Lunchtime private 1:1 sessions and express group clinics',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'afternoon',
    name: 'Afternoon',
    timeWindow: '14:00 – 17:00',
    description: 'Mid-afternoon lessons, progression drills and match play',
    appliesTo: ['weekdays', 'weekends']
  },
  {
    id: 'late_afternoon',
    name: 'Late Afternoon',
    timeWindow: '17:00 – 20:00',
    description: 'Post-work, evening social groups and floodlit court sessions',
    appliesTo: ['weekdays', 'weekends']
  }
];

export const DAYS_CONFIG = {
  weekdays: [
    { id: 'monday', name: 'Monday', short: 'Mon', type: 'Weekday', active: true },
    { id: 'tuesday', name: 'Tuesday', short: 'Tue', type: 'Weekday', active: true },
    { id: 'wednesday', name: 'Wednesday', short: 'Wed', type: 'Weekday', active: true },
    { id: 'thursday', name: 'Thursday', short: 'Thu', type: 'Weekday', active: true },
    { id: 'friday', name: 'Friday', short: 'Fri', type: 'Weekday', active: true }
  ],
  weekends: [
    { id: 'saturday', name: 'Saturday', short: 'Sat', type: 'Weekend', active: true },
    { id: 'sunday', name: 'Sunday', short: 'Sun', type: 'Weekend', active: true }
  ]
};

const STORAGE_KEY = 'padel_crm_time_periods';

// In-memory track of which row is currently being edited
let activeEditingPeriodId = null;

/**
 * Returns the active time periods (either loaded from browser storage or defaults)
 * @returns {Array} Array of time period objects
 */
export function getTimePeriods() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map((period) => (
        period.id === 'morning' && period.timeWindow === '08:00 – 12:00'
          ? { ...period, timeWindow: '09:00 – 12:00' }
          : period
      ));
      if (migrated.some((period, index) => period.timeWindow !== parsed[index].timeWindow)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    }
  } catch (err) {
    console.warn('Could not read custom time periods from storage:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_TIME_PERIODS));
}

/**
 * Updates a specific time period (e.g. modifying its time window)
 * @param {string} periodId - 'morning', 'midday', 'afternoon', 'late_afternoon'
 * @param {Object} updates - Fields to update, e.g. { timeWindow: '12:00 – 13:00' }
 * @returns {Array} Updated array of time periods
 */
export function updateTimePeriod(periodId, updates) {
  const current = getTimePeriods();
  const index = current.findIndex((p) => p.id === periodId);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.warn('Could not save updated time periods to storage:', err);
    }
  }
  return current;
}

/**
 * Resets time periods back to factory defaults
 * @returns {Array} Default array of time periods
 */
export function resetTimePeriods() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Could not reset time periods:', err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_TIME_PERIODS));
}

/**
 * Returns a flat array of all 7 days of the week
 */
export function getAllDays() {
  return [...DAYS_CONFIG.weekdays, ...DAYS_CONFIG.weekends];
}

/**
 * Returns a day and period group identifier (e.g. 'wednesday_morning')
 */
export function getSlotKey(dayId, periodId) {
  return `${dayId}_${periodId}`;
}

/** Individual 30-minute availability slots from 09:00 through 20:00. */
export function getTimeSlots() {
  return Array.from({ length: 22 }, (_, index) => {
    const startMinutes = 9 * 60 + index * 30;
    const endMinutes = startMinutes + 30;
    const formatTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return { id: formatTime(startMinutes), start: formatTime(startMinutes), end: formatTime(endMinutes) };
  });
}

/** Slots fully contained in a bulk-select time group. */
export function getTimeSlotsForPeriod(period) {
  const times = String(period.timeWindow).match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
  if (!times) return [];
  const start = Number(times[1]) * 60 + Number(times[2]);
  const end = Number(times[3]) * 60 + Number(times[4]);
  return getTimeSlots().filter((slot) => {
    const slotStart = Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3));
    return slotStart >= start && slotStart + 30 <= end;
  });
}

/**
 * Dynamically renders the Time Periods Table and the Weekly Matrix
 * and handles inline editing directly in the browser.
 */
export function initTimePeriodsUI() {
  const periodsBody = document.getElementById('time-periods-table-body');
  const matrixBody = document.getElementById('schedule-matrix-body');
  const resetBtn = document.getElementById('btn-reset-time-periods');

  if (!periodsBody || !matrixBody) return;

  function render() {
    const periods = getTimePeriods();

    // 1. Render Daily Time Periods Table Rows
    periodsBody.innerHTML = periods
      .map((p) => {
        const isEditing = activeEditingPeriodId === p.id;
        if (isEditing) {
          return `
            <tr style="background-color: var(--accent-50);">
              <td><strong>${p.name}</strong></td>
              <td><code>${p.id}</code></td>
              <td>
                <input 
                  type="text" 
                  id="input-window-${p.id}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; max-width: 150px; font-weight: 600;" 
                  value="${p.timeWindow}" 
                  placeholder="e.g. 12:00 – 13:00"
                  aria-label="Edit time window for ${p.name}"
                />
              </td>
              <td>
                <input 
                  type="text" 
                  id="input-desc-${p.id}" 
                  class="form-control" 
                  style="font-size: 0.85rem; padding: 0.3rem 0.5rem; width: 100%;" 
                  value="${p.description}" 
                  placeholder="Session description..."
                  aria-label="Edit description for ${p.name}"
                />
              </td>
              <td><span class="badge badge-status-occasional">Editing</span></td>
              <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-sm btn-primary btn-save-period" data-id="${p.id}">
                  💾 Save
                </button>
                <button class="btn btn-sm btn-secondary btn-cancel-period" style="margin-left: 0.35rem;">
                  Cancel
                </button>
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td><code>${p.id}</code></td>
            <td><span class="range-text">${p.timeWindow}</span></td>
            <td class="text-muted">${p.description}</td>
            <td><span class="badge badge-status-active">Active</span></td>
            <td class="text-right">
              <button class="btn btn-sm btn-secondary btn-edit-period" data-id="${p.id}" title="Edit ${p.name} time window">
                ✏️ Edit
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // 2. Update Weekly Schedule Matrix Headers with dynamic time windows
    periods.forEach((p) => {
      const headerEl = document.getElementById(`th-matrix-${p.id}`);
      if (headerEl) {
        headerEl.innerHTML = `
          ${p.name}
          <span class="text-xs text-muted" style="font-weight: 500; display: block; margin-top: 2px;">
            ${p.timeWindow}
          </span>
        `;
      }
    });

    // 3. Render Weekly Matrix Rows (Monday to Sunday)
    const allDays = getAllDays();
    matrixBody.innerHTML = allDays
      .map((day) => {
        const isWeekend = day.type === 'Weekend';
        const rowBg = isWeekend ? 'style="background-color: #fafbfc;"' : '';
        const badgeClass = isWeekend ? 'badge-member' : 'badge-non-member';

        return `
          <tr ${rowBg}>
            <td><strong>${day.name}</strong></td>
            <td><span class="badge ${badgeClass}">${day.type}</span></td>
            <td><span class="tag" style="background-color: var(--accent-100); color: var(--accent-600);">Available</span></td>
            <td><span class="tag" style="background-color: var(--accent-100); color: var(--accent-600);">Available</span></td>
            <td><span class="tag" style="background-color: var(--accent-100); color: var(--accent-600);">Available</span></td>
            <td><span class="tag" style="background-color: var(--accent-100); color: var(--accent-600);">Available</span></td>
            <td class="text-right"><strong>4 slots</strong></td>
          </tr>
        `;
      })
      .join('');

    // 4. Attach Click Listeners
    // Edit button click
    periodsBody.querySelectorAll('.btn-edit-period').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const periodId = e.currentTarget.dataset.id;
        activeEditingPeriodId = periodId;
        render();

        // Auto-focus the window input
        setTimeout(() => {
          const input = document.getElementById(`input-window-${periodId}`);
          if (input) input.focus();
        }, 50);
      });
    });

    // Save button click
    periodsBody.querySelectorAll('.btn-save-period').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const periodId = e.currentTarget.dataset.id;
        const windowInput = document.getElementById(`input-window-${periodId}`);
        const descInput = document.getElementById(`input-desc-${periodId}`);

        if (windowInput && descInput) {
          const newWindow = windowInput.value.trim();
          const newDesc = descInput.value.trim();

          if (!newWindow) {
            alert('Time window cannot be empty.');
            return;
          }

          updateTimePeriod(periodId, {
            timeWindow: newWindow,
            description: newDesc
          });
        }

        activeEditingPeriodId = null;
        render();
      });
    });

    // Cancel button click
    periodsBody.querySelectorAll('.btn-cancel-period').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeEditingPeriodId = null;
        render();
      });
    });
  }

  // Initial render
  render();
}
