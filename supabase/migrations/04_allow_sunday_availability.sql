-- Allow Sunday as an independent day in student availability.
-- Existing availability records remain unchanged.

ALTER TABLE public.student_availability
  DROP CONSTRAINT IF EXISTS student_availability_day_of_week_check;

ALTER TABLE public.student_availability
  ADD CONSTRAINT student_availability_day_of_week_check
  CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));
