-- Keep a permanent, date-only history whenever a student is marked as having
-- completed a lesson theme. The current-state relationship may still be
-- removed when a checkbox is cleared; this history remains.
CREATE TABLE IF NOT EXISTS public.student_lesson_theme_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_theme_id UUID REFERENCES public.lesson_themes(id) ON DELETE SET NULL,
  theme_name TEXT NOT NULL,
  completed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_lesson_theme_logs_student_date
  ON public.student_lesson_theme_logs(student_id, completed_on DESC, logged_at DESC);

ALTER TABLE public.student_lesson_theme_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view lesson theme history for their students"
  ON public.student_lesson_theme_logs;
CREATE POLICY "Coaches can view lesson theme history for their students"
  ON public.student_lesson_theme_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.id = student_lesson_theme_logs.student_id
      AND public.students.user_id = auth.uid()
  ));

GRANT SELECT ON TABLE public.student_lesson_theme_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.log_student_lesson_theme_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_lesson_theme_logs (student_id, lesson_theme_id, theme_name, completed_on)
  SELECT NEW.student_id, NEW.lesson_theme_id, lesson_themes.name, CURRENT_DATE
  FROM public.lesson_themes
  WHERE lesson_themes.id = NEW.lesson_theme_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_student_lesson_theme_completion
  ON public.student_lesson_themes;
CREATE TRIGGER trigger_log_student_lesson_theme_completion
  AFTER INSERT ON public.student_lesson_themes
  FOR EACH ROW EXECUTE FUNCTION public.log_student_lesson_theme_completion();

-- Preserve a date for themes that were already marked complete before this
-- history table was added.
INSERT INTO public.student_lesson_theme_logs
  (student_id, lesson_theme_id, theme_name, completed_on)
SELECT links.student_id, links.lesson_theme_id, themes.name,
       (links.completed_at AT TIME ZONE 'UTC')::date
FROM public.student_lesson_themes AS links
JOIN public.lesson_themes AS themes ON themes.id = links.lesson_theme_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.student_lesson_theme_logs AS logs
  WHERE logs.student_id = links.student_id
    AND logs.lesson_theme_id = links.lesson_theme_id
    AND logs.completed_on = (links.completed_at AT TIME ZONE 'UTC')::date
);
