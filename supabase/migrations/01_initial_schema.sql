-- ============================================================================
-- Migration: 01_initial_schema.sql
-- Description: Initial schema for Padel Coach CRM
-- Includes:
--   1. 'students' core table
--   2. 'student_availability' relational table
--   3. 'student_lesson_preferences' relational table
--   4. 'student_contact_history' relational table
--   5. Constraints, indexes, and updated_at trigger
--   6. Row Level Security (RLS) policies scoped to the authenticated coach
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Core Students Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  membership_status TEXT NOT NULL DEFAULT 'unknown' 
    CHECK (membership_status IN ('member', 'non-member', 'unknown')),
  student_status TEXT NOT NULL DEFAULT 'active' 
    CHECK (student_status IN ('active', 'occasional', 'inactive', 'archived')),
  general_notes TEXT,

  -- Padel Level & Group Range
  current_level NUMERIC(3, 1) NOT NULL DEFAULT 2.0 
    CHECK (current_level >= 1.0 AND current_level <= 7.0),
  min_level NUMERIC(3, 1) NOT NULL DEFAULT 2.0 
    CHECK (min_level >= 1.0 AND min_level <= 7.0),
  max_level NUMERIC(3, 1) NOT NULL DEFAULT 2.5 
    CHECK (max_level >= 1.0 AND max_level <= 7.0),

  -- Contact Preferences & CRM Follow-up
  preferred_contact_method TEXT DEFAULT 'whatsapp' 
    CHECK (preferred_contact_method IN ('whatsapp', 'phone', 'email', 'sms', 'other')),
  interest_in_groups BOOLEAN NOT NULL DEFAULT TRUE,
  last_contacted_date DATE,
  next_follow_up_date DATE,
  contact_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Level Validation Constraint: Min level cannot exceed Max level
  CONSTRAINT check_level_range CHECK (min_level <= max_level)
);

-- ----------------------------------------------------------------------------
-- 2. Student Availability Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  day_of_week TEXT NOT NULL 
    CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  time_period TEXT NOT NULL 
    CHECK (time_period IN ('morning', 'midday', 'afternoon', 'late_afternoon')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent duplicate time slot entries for the same student
  CONSTRAINT unique_student_slot UNIQUE (student_id, day_of_week, time_period)
);

-- ----------------------------------------------------------------------------
-- 3. Student Lesson Format Preferences Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_lesson_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  lesson_format TEXT NOT NULL 
    CHECK (lesson_format IN ('1:1', '1:2', '1:3', '1:4')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent duplicate format preferences for the same student
  CONSTRAINT unique_student_format UNIQUE (student_id, lesson_format)
);

-- ----------------------------------------------------------------------------
-- 4. Student Contact History Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  contact_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  contact_method TEXT NOT NULL 
    CHECK (contact_method IN ('whatsapp', 'phone', 'email', 'sms', 'in_person', 'other')),
  contact_summary TEXT NOT NULL,
  follow_up_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 5. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(student_status);
CREATE INDEX IF NOT EXISTS idx_students_membership ON public.students(membership_status);
CREATE INDEX IF NOT EXISTS idx_students_current_level ON public.students(current_level);
CREATE INDEX IF NOT EXISTS idx_students_level_range ON public.students(min_level, max_level);

CREATE INDEX IF NOT EXISTS idx_availability_student_id ON public.student_availability(student_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_period ON public.student_availability(day_of_week, time_period);

CREATE INDEX IF NOT EXISTS idx_preferences_student_id ON public.student_lesson_preferences(student_id);
CREATE INDEX IF NOT EXISTS idx_preferences_format ON public.student_lesson_preferences(lesson_format);

CREATE INDEX IF NOT EXISTS idx_contact_history_student_id ON public.student_contact_history(student_id);

-- ----------------------------------------------------------------------------
-- 6. Automatic Updated_At Timestamp Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_students_updated_at ON public.students;
CREATE TRIGGER trigger_update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
-- Enable RLS on all CRM tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_contact_history ENABLE ROW LEVEL SECURITY;

-- STUDENTS POLICIES:
-- A coach can only read, insert, update, and delete their own students
CREATE POLICY "Coach can view own students"
  ON public.students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coach can insert own students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach can update own students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coach can delete own students"
  ON public.students FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AVAILABILITY POLICIES:
-- Child records inherit access control from the parent student record
CREATE POLICY "Coach can manage availability for own students"
  ON public.student_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_availability.student_id
      AND public.students.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_availability.student_id
      AND public.students.user_id = auth.uid()
    )
  );

-- LESSON PREFERENCES POLICIES:
CREATE POLICY "Coach can manage preferences for own students"
  ON public.student_lesson_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_lesson_preferences.student_id
      AND public.students.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_lesson_preferences.student_id
      AND public.students.user_id = auth.uid()
    )
  );

-- CONTACT HISTORY POLICIES:
CREATE POLICY "Coach can manage contact history for own students"
  ON public.student_contact_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_contact_history.student_id
      AND public.students.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE public.students.id = public.student_contact_history.student_id
      AND public.students.user_id = auth.uid()
    )
  );
