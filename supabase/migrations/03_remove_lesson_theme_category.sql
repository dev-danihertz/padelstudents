-- Remove the unused category field from lesson themes.
-- Safe to run after 02_lesson_themes.sql; existing theme rows are preserved.

DROP INDEX IF EXISTS public.idx_lesson_themes_category;
ALTER TABLE public.lesson_themes
  DROP COLUMN IF EXISTS category;
