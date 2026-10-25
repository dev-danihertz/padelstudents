import { getTimeSlots } from './availability.js';

const LOCAL_STUDENTS_KEY = 'padel_crm_students';
const LEVELS = Array.from({ length: 25 }, (_, index) => (1 + index * 0.25).toFixed(2));
const DAY_NAMES = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

export function initFindPlayersUI({ supabase, isSupabaseConfigured, getCurrentUser }) {
  const minSelect = document.getElementById('find-level-min');
  const maxSelect = document.getElementById('find-level-max');
  const daySelect = document.getElementById('find-day');
  const timeSelect = document.getElementById('find-time');
  const results = document.getElementById('find-players-results');
  const count = document.getElementById('find-players-count');
  const info = document.getElementById('find-players-info');
  const refreshButton = document.getElementById('btn-refresh-player-results');
  if (!minSelect || !maxSelect || !daySelect || !timeSelect || !results) return null;

  minSelect.innerHTML = LEVELS.map((level) => `<option value="${level}">${level}</option>`).join('');
  maxSelect.innerHTML = minSelect.innerHTML;
  minSelect.value = '2.50';
  maxSelect.value = '3.00';
  timeSelect.insertAdjacentHTML('beforeend', getTimeSlots()
    .map((slot) => `<option value="${slot.id}">${slot.start}</option>`).join(''));

  let students = [];
  let isLoading = false;

  function render() {
    const sessionMin = Number(minSelect.value);
    const sessionMax = Number(maxSelect.value);
    const selectedDay = daySelect.value;
    const selectedTime = timeSelect.value;
    if (sessionMin > sessionMax) {
      if (count) count.textContent = '0';
      results.innerHTML = '<p class="text-muted player-results-empty">The minimum level must be less than or equal to the maximum.</p>';
      return;
    }
    const matched = students.filter((student) => {
      const studentMin = Number(student.min_level ?? student.current_level ?? 0);
      const studentMax = Number(student.max_level ?? student.current_level ?? 0);
      const overlapsLevel = studentMin <= sessionMax && studentMax >= sessionMin;
      const slots = student.availability || [];
      const matchesAvailability = slots.some((slot) =>
        (selectedDay === 'all' || slot.day_of_week === selectedDay) &&
        (selectedTime === 'all' || slot.time_period === selectedTime)
      );
      return student.student_status !== 'archived' && overlapsLevel && matchesAvailability;
    });

    if (count) count.textContent = String(matched.length);
    if (!matched.length) {
      results.innerHTML = '<p class="text-muted player-results-empty">No students match this level range and availability.</p>';
      return;
    }
    results.innerHTML = matched.map((student) => {
      const matchingSlots = (student.availability || []).filter((slot) =>
        (selectedDay === 'all' || slot.day_of_week === selectedDay) &&
        (selectedTime === 'all' || slot.time_period === selectedTime)
      );
      const slotSummary = matchingSlots.slice(0, 3).map((slot) =>
        `${DAY_NAMES[slot.day_of_week] || slot.day_of_week} ${slot.time_period}`
      ).join(' · ');
      return `<article class="player-result">
        <div class="player-result-main">
          <strong>${escapeHtml(student.full_name)}</strong>
          <span class="text-muted">Level ${Number(student.current_level || 0).toFixed(2)} · Acceptable ${Number(student.min_level || 0).toFixed(2)}–${Number(student.max_level || 0).toFixed(2)}</span>
          <span class="text-muted">${escapeHtml(slotSummary)}${matchingSlots.length > 3 ? ` · +${matchingSlots.length - 3} more` : ''}</span>
        </div>
        <span class="badge ${student.membership_status === 'member' ? 'badge-member' : 'badge-status-occasional'}">${student.membership_status === 'member' ? 'Member' : student.membership_status === 'non-member' ? 'Non-member' : 'Unknown membership'}</span>
      </article>`;
    }).join('');
  }

  async function refresh() {
    if (isLoading) return;
    isLoading = true;
    if (refreshButton) refreshButton.disabled = true;
    if (info) info.textContent = 'Loading students and availability…';
    try {
      if (!isSupabaseConfigured) {
        students = JSON.parse(localStorage.getItem(LOCAL_STUDENTS_KEY) || '[]');
        if (info) info.textContent = 'Using student records saved in this browser.';
      } else if (!getCurrentUser()) {
        students = [];
        if (info) info.textContent = 'Sign in to search students from Supabase.';
      } else {
        const { data: rows, error } = await supabase.from('students')
          .select('id, full_name, current_level, min_level, max_level, membership_status, student_status')
          .order('full_name');
        if (error) throw error;
        const ids = (rows || []).map((student) => student.id);
        let availability = [];
        if (ids.length) {
          const { data, error: availabilityError } = await supabase.from('student_availability')
            .select('student_id, day_of_week, time_period').in('student_id', ids);
          if (availabilityError) throw availabilityError;
          availability = data || [];
        }
        students = (rows || []).map((student) => ({
          ...student,
          availability: availability.filter((slot) => slot.student_id === student.id)
        }));
        if (info) info.textContent = `${students.length} student records loaded from Supabase.`;
      }
    } catch (error) {
      students = [];
      if (info) info.textContent = `Could not load students: ${error.message || error}`;
    } finally {
      isLoading = false;
      if (refreshButton) refreshButton.disabled = false;
      render();
    }
  }

  [minSelect, maxSelect, daySelect, timeSelect].forEach((control) => control.addEventListener('change', render));
  refreshButton?.addEventListener('click', refresh);
  render();
  return { refresh };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}
