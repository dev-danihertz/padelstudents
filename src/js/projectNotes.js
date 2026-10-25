const STORAGE_KEY = 'padel_crm_project_notes';

export function initProjectNotesUI({ supabase, isSupabaseConfigured, getCurrentUser }) {
  const textarea = document.getElementById('project-notes-text');
  const status = document.getElementById('project-notes-save-status');
  const saveButton = document.getElementById('btn-save-project-notes');
  if (!textarea || !status || !saveButton) return null;

  let saveTimer = null;
  let isSaving = false;
  let queuedSave = false;
  let lastLoadedUserId = null;

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.className = `text-xs ${isError ? 'student-feedback-error' : 'text-muted'}`;
  };

  function saveLocally() {
    try {
      localStorage.setItem(STORAGE_KEY, textarea.value);
      setStatus(`Salvo neste navegador às ${formatTime(new Date())}.`);
    } catch (error) {
      setStatus(`Não foi possível salvar: ${error.message || error}`, true);
    }
  }

  async function save() {
    if (isSaving) {
      queuedSave = true;
      return;
    }
    if (!isSupabaseConfigured) {
      saveLocally();
      return;
    }
    const user = getCurrentUser();
    if (!user?.id) {
      setStatus('Entre na sua conta para salvar as anotações do projeto.', true);
      return;
    }

    const content = textarea.value;
    isSaving = true;
    saveButton.disabled = true;
    setStatus('Salvando…');
    try {
      const { error } = await supabase.from('coach_project_notes').upsert({
        user_id: user.id,
        content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
      localStorage.setItem(STORAGE_KEY, content);
      setStatus(`Salvo na nuvem às ${formatTime(new Date())}.`);
    } catch (error) {
      setStatus(`Não foi possível salvar na nuvem: ${error.message || error}`, true);
    } finally {
      isSaving = false;
      saveButton.disabled = false;
      if (queuedSave) {
        queuedSave = false;
        save();
      }
    }
  }

  async function refresh() {
    const user = getCurrentUser();
    if (!isSupabaseConfigured) {
      textarea.value = localStorage.getItem(STORAGE_KEY) || '';
      textarea.disabled = false;
      saveButton.disabled = false;
      setStatus('Salva somente neste navegador.');
      return;
    }
    if (!user?.id) {
      textarea.value = '';
      textarea.disabled = true;
      saveButton.disabled = true;
      lastLoadedUserId = null;
      setStatus('Entre na sua conta para acessar as anotações.', true);
      return;
    }
    if (lastLoadedUserId === user.id) return;
    textarea.disabled = true;
    saveButton.disabled = true;
    setStatus('Carregando anotações…');
    try {
      const { data, error } = await supabase.from('coach_project_notes')
        .select('content, updated_at').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      textarea.value = data?.content || '';
      localStorage.setItem(STORAGE_KEY, textarea.value);
      lastLoadedUserId = user.id;
      setStatus(data?.updated_at ? `Último salvamento: ${formatDateTime(data.updated_at)}.` : 'Ainda não há anotações salvas.');
    } catch (error) {
      textarea.value = '';
      setStatus(`Não foi possível carregar as anotações: ${error.message || error}`, true);
    } finally {
      textarea.disabled = false;
      saveButton.disabled = false;
    }
  }

  textarea.addEventListener('input', () => {
    setStatus('Alterações pendentes…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 800);
  });
  saveButton.addEventListener('click', () => {
    clearTimeout(saveTimer);
    save();
  });

  return { refresh, save };
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date(value));
}
