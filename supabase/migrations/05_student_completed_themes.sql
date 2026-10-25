-- Track which curriculum themes each student has completed.
CREATE TABLE IF NOT EXISTS public.student_lesson_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_theme_id UUID NOT NULL REFERENCES public.lesson_themes(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_student_lesson_theme UNIQUE (student_id, lesson_theme_id)
);

CREATE INDEX IF NOT EXISTS idx_student_lesson_themes_student_id
  ON public.student_lesson_themes(student_id);

ALTER TABLE public.student_lesson_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view completed themes for their students"
  ON public.student_lesson_themes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.id = student_lesson_themes.student_id
      AND public.students.user_id = auth.uid()
  ));

CREATE POLICY "Coaches can mark themes completed for their students"
  ON public.student_lesson_themes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = student_lesson_themes.student_id
        AND public.students.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.lesson_themes
      WHERE public.lesson_themes.id = student_lesson_themes.lesson_theme_id
        AND (public.lesson_themes.user_id = auth.uid() OR public.lesson_themes.user_id IS NULL)
    )
  );

CREATE POLICY "Coaches can unmark themes for their students"
  ON public.student_lesson_themes FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.id = student_lesson_themes.student_id
      AND public.students.user_id = auth.uid()
  ));
