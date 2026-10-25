-- Store the coach's project-wide README notes in their authenticated account.
CREATE TABLE IF NOT EXISTS public.coach_project_notes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.coach_project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their project notes"
  ON public.coach_project_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can create their project notes"
  ON public.coach_project_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update their project notes"
  ON public.coach_project_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON TABLE public.coach_project_notes TO authenticated;
