/** Student directory with per-student weekly availability. */
import { getLessonThemes } from './lessonThemes.js';
import { getTimeSlots, getTimeSlotsForPeriod } from './availability.js';

const LOCAL_STORAGE_KEY = 'padel_crm_students';

const STATUS_LABELS = {
  active: 'Active',
  occasional: 'Occasional',
  inactive: 'Inactive',
  archived: 'Archived'
};

export function initStudentsUI({ supabase, isSupabaseConfigured, getCurrentUser, getAllDays, getTimePeriods, onStudentsUpdated }) {
  const tableBody = document.getElementById('students-table-body');
  const modal = document.getElementById('student-modal');
  const form = document.getElementById('student-form');
  const availabilityGrid = document.getElementById('student-availability-grid');
  const weeklyAvailabilityShortcuts = document.getElementById('weekly-availability-shortcuts');
  const completedThemesGrid = document.getElementById('student-completed-themes');
  const addButton = document.getElementById('btn-add-student');
  const searchInput = document.getElementById('student-search-input');
  const membershipFilter = document.getElementById('filter-membership');
  const levelFilter = document.getElementById('filter-level');
  const targetLevelFilter = document.getElementById('filter-target-level');
  const availabilityDayFilter = document.getElementById('filter-availability-day');
  const availabilityPeriodFilter = document.getElementById('filter-availability-period');
  const clearFiltersButton = document.getElementById('btn-clear-student-filters');
  const activeTab = document.getElementById('tab-active-students');
  const archivedTab = document.getElementById('tab-archived-students');
  const feedback = document.getElementById('student-form-feedback');
  const submitButton = document.getElementById('save-student-btn');
  const tableInfo = document.getElementById('students-table-info');
  let students = [];
  let availableThemes = [];
  let editingStudentId = null;
  let selectedTab = 'active';

  if (!tableBody || !modal || !form || !availabilityGrid) return;

  const availabilityGroups = getTimePeriods();
  availabilityPeriodFilter.innerHTML = '<option value="all">Any time</option>' +
    `<optgroup label="Quick-select groups">${availabilityGroups.map((period) => `<option value="group:${escapeHtml(period.id)}">${escapeHtml(period.name)} (${escapeHtml(period.timeWindow)})</option>`).join('')}</optgroup>` +
    `<optgroup label="30-minute slots">${getTimeSlots().map((slot) => `<option value="slot:${slot.id}">${slot.start}–${slot.end}</option>`).join('')}</optgroup>`;

  function setFeedback(message, isError = false) {
    feedback.textContent = message;
    feedback.className = `text-xs ${isError ? 'student-feedback-error' : 'text-muted'}`;
  }

  function readLocalStudents() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    } catch (error) {
      console.warn('Could not read local student records:', error);
      return [];
    }
  }

  function saveLocalStudents(value) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
  }

  function renderAvailabilityChoices(selected = []) {
    const periods = getTimePeriods();
    const days = getAllDays();
    const slots = getTimeSlots();
    const selectedKeys = new Set(selected.map((slot) => `${slot.day_of_week}::${slot.time_period}`));
    weeklyAvailabilityShortcuts.innerHTML = `<span class="weekly-shortcut-label">Apply to every day:</span>${periods.map((period) => {
      const periodSlots = getTimeSlotsForPeriod(period);
      const everyDaySelected = days.every((day) => periodSlots.every((slot) => selectedKeys.has(`${day.id}::${slot.id}`)));
      const someDaySelected = days.some((day) => periodSlots.some((slot) => selectedKeys.has(`${day.id}::${slot.id}`)));
      const indeterminate = someDaySelected && !everyDaySelected;
      return `<label class="weekly-shortcut-choice"><input type="checkbox" class="weekly-group-checkbox" data-period-id="${escapeHtml(period.id)}" ${periodSlots.length ? '' : 'disabled'} ${everyDaySelected && periodSlots.length ? 'checked' : ''} ${indeterminate ? 'data-indeterminate="true"' : ''}><span>${escapeHtml(period.name)}</span></label>`;
    }).join('')}`;
    weeklyAvailabilityShortcuts.querySelectorAll('.weekly-group-checkbox[data-indeterminate="true"]').forEach((checkbox) => {
      checkbox.indeterminate = true;
    });
    const groups = [
      { label: 'Weekdays', days: days.filter((day) => day.type === 'Weekday') },
      { label: 'Weekend', days: days.filter((day) => day.type === 'Weekend') }
    ];

    availabilityGrid.innerHTML = groups.map((group) => `
      <section class="availability-day-group" aria-label="${group.label}">
        <h3>${group.label}</h3>
        <div class="availability-days-grid">
          ${group.days.map((day) => `
            <fieldset class="availability-day-card">
              <legend>${day.name}</legend>
              ${periods.map((period) => {
                const periodSlots = getTimeSlotsForPeriod(period);
                const selectedCount = periodSlots.filter((slot) => selectedKeys.has(`${day.id}::${slot.id}`)).length;
                const groupChecked = selectedCount === periodSlots.length && periodSlots.length > 0;
                const groupIndeterminate = selectedCount > 0 && !groupChecked;
                return `<section class="day-period-group" data-period-id="${escapeHtml(period.id)}">
                  <label class="availability-group-toggle"><input type="checkbox" class="availability-group-checkbox" ${periodSlots.length ? '' : 'disabled'} ${groupChecked ? 'checked' : ''} ${groupIndeterminate ? 'data-indeterminate="true"' : ''}><span>${escapeHtml(period.name)}<small>${escapeHtml(period.timeWindow)} · select all</small></span></label>
                  <div class="availability-slots-grid">${periodSlots.map((slot) => {
                    const key = `${day.id}::${slot.id}`;
                    const checked = selectedKeys.has(key) ? 'checked' : '';
                    return `<label class="availability-choice"><input type="checkbox" name="availability" value="${key}" ${checked}><span>${slot.start}</span></label>`;
                  }).join('')}</div>
                </section>`;
              }).join('')}
            </fieldset>
          `).join('')}
        </div>
      </section>
    `).join('');
    availabilityGrid.querySelectorAll('.availability-group-checkbox[data-indeterminate="true"]').forEach((checkbox) => {
      checkbox.indeterminate = true;
    });
  }

  function renderCompletedThemeChoices(selected = []) {
    const selectedIds = new Set(selected);
    completedThemesGrid.innerHTML = availableThemes.length
      ? availableThemes.map((theme) => `
          <label class="completed-theme-choice">
            <input type="checkbox" name="completed_themes" value="${escapeHtml(theme.id)}" ${selectedIds.has(theme.id) ? 'checked' : ''}>
            <span>${escapeHtml(theme.name)}</span>
          </label>
        `).join('')
      : '<p class="text-muted text-xs">No lesson themes are available yet. Add themes on the Lesson Themes page.</p>';
  }

  async function openForm(student = null) {
    editingStudentId = student?.id || null;
    form.reset();
    form.elements.full_name.value = student?.full_name || '';
    form.elements.phone.value = student?.phone || '';
    form.elements.email.value = student?.email || '';
    form.elements.membership_status.value = student?.membership_status || 'unknown';
    form.elements.student_status.value = student?.student_status || 'active';
    form.elements.current_level.value = student?.current_level ?? '2.00';
    form.elements.min_level.value = student?.min_level ?? '2.00';
    form.elements.max_level.value = student?.max_level ?? '2.50';
    form.elements.general_notes.value = student?.general_notes || '';
    form.elements.do_not_send_marketing.checked = student?.do_not_send_marketing === true;
    renderAvailabilityChoices(student?.availability || []);
    if (isSupabaseConfigured && getCurrentUser()) {
      const { data, error } = await supabase.from('lesson_themes')
        .select('id, name, description, status, sort_order').order('sort_order').order('name');
      if (!error) availableThemes = data || [];
      else console.error('Could not refresh lesson themes for the student form:', error);
    } else if (!isSupabaseConfigured) {
      availableThemes = getLessonThemes();
    }
    renderCompletedThemeChoices(student?.completedThemes || []);
    document.getElementById('student-modal-title').textContent = editingStudentId ? `Edit ${student.full_name}` : 'Add Student';
    submitButton.textContent = editingStudentId ? 'Save Changes' : 'Save Student';
    setFeedback(isSupabaseConfigured ? 'Changes will be saved to Supabase.' : 'Local mode: records are saved in this browser only.');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    form.elements.full_name.focus();
  }

  function closeForm() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    editingStudentId = null;
  }

  async function loadStudents() {
    if (!isSupabaseConfigured) {
      students = readLocalStudents();
      availableThemes = getLessonThemes();
      tableInfo.textContent = 'Local browser mode: student records are saved only in this browser.';
      render();
      return;
    }
    if (!getCurrentUser()) {
      students = [];
      availableThemes = [];
      tableInfo.textContent = 'Sign in to load student records from Supabase.';
      render();
      return;
    }

    const notices = [];
    const { data: themeData, error: themeError } = await supabase.from('lesson_themes')
      .select('id, name, status, sort_order').order('sort_order').order('name');
    availableThemes = themeError ? [] : (themeData || []);
    if (themeError) notices.push(`Lesson themes could not be loaded: ${themeError.message}`);

    const { data, error } = await supabase.from('students').select('*').order('full_name');
    if (error) {
      tableInfo.textContent = `Could not load students: ${error.message}`;
      students = [];
      render();
      return;
    }

    const ids = data.map((student) => student.id);
    let slots = [];
    let completedThemeLinks = [];
    if (ids.length) {
      const availabilityResult = await supabase.from('student_availability').select('student_id, day_of_week, time_period').in('student_id', ids);
      if (availabilityResult.error) {
        notices.push(`Availability could not be read: ${availabilityResult.error.message}`);
      } else {
        slots = availabilityResult.data || [];
      }
      const themesResult = await supabase.from('student_lesson_themes').select('student_id, lesson_theme_id').in('student_id', ids);
      if (themesResult.error) {
        notices.push(`Completed themes could not be read: ${themesResult.error.message}`);
      } else {
        completedThemeLinks = themesResult.data || [];
      }
    }
    students = data.map((student) => ({
      ...student,
      availability: slots.filter((slot) => slot.student_id === student.id),
      completedThemes: completedThemeLinks.filter((link) => link.student_id === student.id).map((link) => link.lesson_theme_id)
    }));
    tableInfo.textContent = notices.length
      ? `Student records loaded. ${notices.join(' ')}`
      : 'Student records, availability, and completed themes are synchronised with Supabase.';
    render();
  }

  function visibleStudents() {
    const query = searchInput.value.trim().toLowerCase();
    const membership = membershipFilter.value;
    const level = levelFilter.value;
    const targetLevel = targetLevelFilter.value === '' ? null : Number(targetLevelFilter.value);
    const selectedDay = availabilityDayFilter.value;
    const selectedPeriod = availabilityPeriodFilter.value;
    return students.filter((student) => {
      const status = student.student_status || 'active';
      const matchesTab = selectedTab === 'archived' ? status === 'archived' : status !== 'archived';
      const matchesMembership = membership === 'all' || student.membership_status === membership;
      const currentLevel = Number(student.current_level || 0);
      const matchesLevel = level === 'all' ||
        (level === 'beginner' && currentLevel <= 2) ||
        (level === 'improver' && currentLevel >= 2.5 && currentLevel <= 3) ||
        (level === 'intermediate' && currentLevel >= 3.5 && currentLevel <= 4) ||
        (level === 'advanced' && currentLevel >= 4.5);
      const minLevel = Number(student.min_level ?? 0);
      const maxLevel = Number(student.max_level ?? 0);
      const matchesTargetLevel = targetLevel === null || (minLevel <= targetLevel && targetLevel <= maxLevel);
      const availability = student.availability || [];
      const matchesTimeSelection = (slot) => {
        if (selectedPeriod === 'all') return true;
        if (selectedPeriod.startsWith('slot:')) return slot.time_period === selectedPeriod.slice(5);
        if (selectedPeriod.startsWith('group:')) {
          const group = availabilityGroups.find((period) => period.id === selectedPeriod.slice(6));
          return group && getTimeSlotsForPeriod(group).some((timeSlot) => timeSlot.id === slot.time_period);
        }
        return false;
      };
      const matchesDay = selectedDay === 'all' || availability.some((slot) => slot.day_of_week === selectedDay);
      const matchesPeriod = selectedPeriod === 'all' || availability.some(matchesTimeSelection);
      const matchesSelectedSlot = selectedDay === 'all' || selectedPeriod === 'all' ||
        availability.some((slot) => slot.day_of_week === selectedDay && matchesTimeSelection(slot));
      const text = `${student.full_name} ${student.email || ''} ${student.phone || ''}`.toLowerCase();
      return matchesTab && matchesMembership && matchesLevel && matchesTargetLevel &&
        matchesDay && matchesPeriod && matchesSelectedSlot && text.includes(query);
    });
  }

  function render() {
    const filtered = visibleStudents();
    document.getElementById('active-count-label').textContent = String(students.filter((student) => student.student_status !== 'archived').length);
    document.getElementById('archived-count-label').textContent = String(students.filter((student) => student.student_status === 'archived').length);
    onStudentsUpdated?.(students);
    if (!filtered.length) {
      tableBody.innerHTML = `<tr class="student-empty-row"><td colspan="5" class="student-empty-state">${students.length ? 'No students match these filters.' : 'No student records yet. Select “+ Add Student” to create the first record.'}</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map((student) => {
      const status = student.student_status || 'active';
      const membershipLabel = student.membership_status === 'member' ? 'Member' : student.membership_status === 'non-member' ? 'Non-member' : 'Unknown';
      const membershipClass = student.membership_status === 'member' ? 'badge-member' : student.membership_status === 'non-member' ? 'badge-non-member' : 'badge-unknown';
      const statusClass = status === 'active' ? 'badge-status-active' : status === 'occasional' ? 'badge-status-occasional' : 'badge-status-inactive';
      return `<tr>
        <td class="student-name-cell"><button type="button" class="student-name-link btn-edit-student" data-id="${escapeHtml(student.id)}" aria-label="Edit ${escapeHtml(student.full_name)}">${escapeHtml(student.full_name)}</button>${student.do_not_send_marketing ? '<span class="marketing-opt-out-indicator" role="img" aria-label="Não enviar mensagens de marketing" title="Não enviar mensagens de marketing"></span>' : ''}</td>
        <td data-label="Membership"><span class="badge ${membershipClass}">${membershipLabel}</span></td>
        <td data-label="Level"><span class="level-pill">${Number(student.current_level || 0).toFixed(2)}</span></td>
        <td data-label="Acceptable Group Range"><span class="range-text">${Number(student.min_level || 0).toFixed(2)} – ${Number(student.max_level || 0).toFixed(2)}</span></td>
        <td data-label="Status"><span class="badge ${statusClass}">${STATUS_LABELS[status] || escapeHtml(status)}</span></td>
      </tr>`;
    }).join('');

    tableBody.querySelectorAll('.btn-edit-student').forEach((button) => {
      button.addEventListener('click', () => {
        const student = students.find((item) => item.id === button.dataset.id);
        if (student) openForm(student);
      });
    });
  }

  async function saveStudent(event) {
    event.preventDefault();
    if (isSupabaseConfigured && !getCurrentUser()) {
      setFeedback('Sign in with the coach account before saving to Supabase.', true);
      return;
    }

    const formData = new FormData(form);
    const minLevel = Number(formData.get('min_level'));
    const maxLevel = Number(formData.get('max_level'));
    if (minLevel > maxLevel) {
      setFeedback('Minimum group level cannot be greater than maximum group level.', true);
      return;
    }
    const studentFields = {
      full_name: String(formData.get('full_name')).trim(),
      phone: String(formData.get('phone') || '').trim() || null,
      email: String(formData.get('email') || '').trim() || null,
      membership_status: formData.get('membership_status'),
      student_status: formData.get('student_status'),
      do_not_send_marketing: formData.get('do_not_send_marketing') === 'on',
      general_notes: String(formData.get('general_notes') || '').trim() || null,
      current_level: Number(formData.get('current_level')),
      min_level: minLevel,
      max_level: maxLevel
    };
    const selectedSlots = Array.from(form.querySelectorAll('input[name="availability"]:checked')).map((checkbox) => {
      const [day_of_week, time_period] = checkbox.value.split('::');
      return { day_of_week, time_period };
    });
    const selectedThemeIds = Array.from(form.querySelectorAll('input[name="completed_themes"]:checked')).map((checkbox) => checkbox.value);
    submitButton.disabled = true;
    submitButton.textContent = 'Saving…';

    try {
      if (!isSupabaseConfigured) {
        const localStudents = readLocalStudents();
        if (editingStudentId) {
          const index = localStudents.findIndex((student) => student.id === editingStudentId);
          if (index === -1) throw new Error('This student record could not be found in local storage.');
          localStudents[index] = { ...localStudents[index], ...studentFields, availability: selectedSlots, completedThemes: selectedThemeIds };
        } else {
          localStudents.push({ id: crypto.randomUUID(), ...studentFields, availability: selectedSlots, completedThemes: selectedThemeIds, created_at: new Date().toISOString() });
        }
        saveLocalStudents(localStudents);
      } else if (editingStudentId) {
        const { error: updateError } = await supabase.from('students').update(studentFields).eq('id', editingStudentId);
        if (updateError) throw updateError;
        if (selectedSlots.length) {
          const { error: upsertError } = await supabase.from('student_availability').upsert(
            selectedSlots.map((slot) => ({ ...slot, student_id: editingStudentId })),
            { onConflict: 'student_id,day_of_week,time_period' }
          );
          if (upsertError) throw upsertError;
        }
        const { data: savedSlots, error: fetchError } = await supabase.from('student_availability')
          .select('id, day_of_week, time_period').eq('student_id', editingStudentId);
        if (fetchError) throw fetchError;
        const selectedKeys = new Set(selectedSlots.map((slot) => `${slot.day_of_week}::${slot.time_period}`));
        const obsoleteIds = savedSlots
          .filter((slot) => !selectedKeys.has(`${slot.day_of_week}::${slot.time_period}`))
          .map((slot) => slot.id);
        if (obsoleteIds.length) {
          const { error: deleteError } = await supabase.from('student_availability').delete().in('id', obsoleteIds);
          if (deleteError) throw deleteError;
        }
        const { data: savedThemeLinks, error: themeFetchError } = await supabase.from('student_lesson_themes')
          .select('id, lesson_theme_id').eq('student_id', editingStudentId);
        if (themeFetchError) throw themeFetchError;
        const existingThemeIds = new Set(savedThemeLinks.map((link) => link.lesson_theme_id));
        const newThemeIds = selectedThemeIds.filter((id) => !existingThemeIds.has(id));
        if (newThemeIds.length) {
          const { error: themeInsertError } = await supabase.from('student_lesson_themes').insert(
            newThemeIds.map((lesson_theme_id) => ({ student_id: editingStudentId, lesson_theme_id }))
          );
          if (themeInsertError) throw themeInsertError;
        }
        const obsoleteThemeLinkIds = savedThemeLinks
          .filter((link) => !selectedThemeIds.includes(link.lesson_theme_id))
          .map((link) => link.id);
        if (obsoleteThemeLinkIds.length) {
          const { error: themeDeleteError } = await supabase.from('student_lesson_themes').delete().in('id', obsoleteThemeLinkIds);
          if (themeDeleteError) throw themeDeleteError;
        }
      } else {
        const { data, error } = await supabase.from('students').insert({ ...studentFields, user_id: getCurrentUser().id }).select().single();
        if (error) throw error;
        if (selectedSlots.length) {
          const { error: availabilityError } = await supabase.from('student_availability').insert(selectedSlots.map((slot) => ({ ...slot, student_id: data.id })));
          if (availabilityError) {
            await supabase.from('students').delete().eq('id', data.id);
            throw availabilityError;
          }
        }
        if (selectedThemeIds.length) {
          const { error: themeError } = await supabase.from('student_lesson_themes').insert(
            selectedThemeIds.map((lesson_theme_id) => ({ student_id: data.id, lesson_theme_id }))
          );
          if (themeError) {
            await supabase.from('students').delete().eq('id', data.id);
            throw themeError;
          }
        }
      }
      closeForm();
      await loadStudents();
    } catch (error) {
      setFeedback(`Could not save this student: ${error.message || error}`, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = editingStudentId ? 'Save Changes' : 'Save Student';
    }
  }

  addButton.addEventListener('click', () => {
    window.location.hash = '#students';
    openForm();
  });
  document.getElementById('close-student-modal').addEventListener('click', closeForm);
  document.getElementById('cancel-student-form').addEventListener('click', closeForm);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeForm(); });
  form.addEventListener('submit', saveStudent);
  searchInput.addEventListener('input', render);
  membershipFilter.addEventListener('change', render);
  levelFilter.addEventListener('change', render);
  targetLevelFilter.addEventListener('input', render);
  availabilityDayFilter.addEventListener('change', render);
  availabilityPeriodFilter.addEventListener('change', render);
  clearFiltersButton.addEventListener('click', () => {
    searchInput.value = '';
    membershipFilter.value = 'all';
    levelFilter.value = 'all';
    targetLevelFilter.value = '';
    availabilityDayFilter.value = 'all';
    availabilityPeriodFilter.value = 'all';
    render();
  });
  activeTab.addEventListener('click', () => {
    selectedTab = 'active'; activeTab.classList.add('active'); archivedTab.classList.remove('active'); render();
  });
  archivedTab.addEventListener('click', () => {
    selectedTab = 'archived'; archivedTab.classList.add('active'); activeTab.classList.remove('active'); render();
  });

  availabilityGrid.addEventListener('change', (event) => {
    const dayGroup = event.target.closest('.availability-day-card');
    if (!dayGroup) return;
    if (event.target.classList.contains('availability-group-checkbox')) {
      const periodGroup = event.target.closest('.day-period-group');
      periodGroup.querySelectorAll('input[name="availability"]').forEach((checkbox) => {
        checkbox.checked = event.target.checked;
      });
      updateWeeklyShortcutStates();
      return;
    }
    if (event.target.matches('input[name="availability"]')) {
      const group = event.target.closest('.day-period-group');
      const boxes = Array.from(group.querySelectorAll('input[name="availability"]'));
      const groupCheckbox = group.querySelector('.availability-group-checkbox');
      const checkedCount = boxes.filter((checkbox) => checkbox.checked).length;
      groupCheckbox.checked = checkedCount === boxes.length;
      groupCheckbox.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
    }
    updateWeeklyShortcutStates();
  });

  weeklyAvailabilityShortcuts.addEventListener('change', (event) => {
    if (!event.target.classList.contains('weekly-group-checkbox')) return;
    const period = availabilityGroups.find((item) => item.id === event.target.dataset.periodId);
    availabilityGrid.querySelectorAll('.day-period-group').forEach((periodGroup) => {
      if (periodGroup.dataset.periodId !== period.id) return;
      const checkboxes = Array.from(periodGroup.querySelectorAll('input[name="availability"]'));
      checkboxes.forEach((checkbox) => {
        checkbox.checked = event.target.checked;
      });
      const dailyGroupToggle = periodGroup.querySelector('.availability-group-checkbox');
      dailyGroupToggle.checked = event.target.checked;
      dailyGroupToggle.indeterminate = false;
    });
    updateWeeklyShortcutStates();
  });

  function updateWeeklyShortcutStates() {
    const selectedKeys = new Set(Array.from(form.querySelectorAll('input[name="availability"]:checked')).map((checkbox) => checkbox.value));
    const days = getAllDays();
    weeklyAvailabilityShortcuts.querySelectorAll('.weekly-group-checkbox').forEach((checkbox) => {
      const period = availabilityGroups.find((item) => item.id === checkbox.dataset.periodId);
      const periodSlots = getTimeSlotsForPeriod(period);
      const everyDaySelected = days.every((day) => periodSlots.every((slot) => selectedKeys.has(`${day.id}::${slot.id}`)));
      const someDaySelected = days.some((day) => periodSlots.some((slot) => selectedKeys.has(`${day.id}::${slot.id}`)));
      checkbox.checked = everyDaySelected && periodSlots.length > 0;
      checkbox.indeterminate = someDaySelected && !checkbox.checked;
    });
  }

  loadStudents();
  return { refresh: loadStudents };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
