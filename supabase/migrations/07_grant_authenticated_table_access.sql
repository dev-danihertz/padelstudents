-- Grant authenticated application users the SQL privileges needed to use the
-- CRM tables. Row Level Security policies continue to restrict which rows
-- each coach can access.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.students,
  public.student_availability,
  public.student_lesson_preferences,
  public.student_contact_history,
  public.lesson_themes,
  public.student_lesson_themes
TO authenticated;
