-- Remember students who should not receive marketing messages.
-- Existing students default to false (no opt-out flag set).
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS do_not_send_marketing BOOLEAN NOT NULL DEFAULT FALSE;
