-- ============================================================================
-- Migration: 02_lesson_themes.sql
-- Description: Coaching Lesson Themes (Temas de Aula) schema
-- Includes:
--   1. 'lesson_themes' table for curriculum topics (Double Glass, Overhead, Volley, Back Glass, Lob, etc.)
--   2. Default seed data for initial 5 themes
--   3. Row Level Security (RLS) policies scoped to authenticated coach
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Theme Information
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  sort_order INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for category search & coach filtering
CREATE INDEX IF NOT EXISTS idx_lesson_themes_user_id ON public.lesson_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_themes_category ON public.lesson_themes(category);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lesson_themes ENABLE ROW LEVEL SECURITY;

-- Coach can view and manage their themes
CREATE POLICY "Coaches can view their own lesson themes"
  ON public.lesson_themes
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Coaches can insert lesson themes"
  ON public.lesson_themes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Coaches can update their own lesson themes"
  ON public.lesson_themes
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Coaches can delete their own lesson themes"
  ON public.lesson_themes
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Seed initial themes
INSERT INTO public.lesson_themes (name, category, description, status, sort_order)
VALUES
  ('Double Glass', 'Wall Defence', 'Reading side-to-back and back-to-side rebounds, corner positioning, body rotation, and counter-attacks.', 'Active', 1),
  ('Overhead', 'Aerial & Attack', 'Mastery of bandeja, víbora, kick smash, and flat smash: footwork, contact point, depth, and placement.', 'Active', 2),
  ('Volley', 'Net Play', 'Forehand and backhand net volleys, low contact blocking, punch volleys, depth control, and footwork.', 'Active', 3),
  ('Back Glass', 'Wall Defence', 'Reading deep balls off the rear wall, timing the bounce, proper spacing, defensive lobs, and bajadas.', 'Active', 4),
  ('Lob', 'Transition & Defence', 'Defensive lob height and trajectory to reset points, push opponents off the net, and reclaim court position.', 'Active', 5)
ON CONFLICT DO NOTHING;
