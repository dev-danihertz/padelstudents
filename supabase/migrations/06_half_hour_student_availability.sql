-- Replace broad student time-period labels with individual half-hour slots.
-- Existing broad selections are expanded into the matching new time group.
BEGIN;

CREATE TEMP TABLE migrated_student_availability ON COMMIT DROP AS
SELECT DISTINCT
  availability.student_id,
  availability.day_of_week,
  to_char(time '00:00' + make_interval(mins => slot_minutes), 'HH24:MI') AS time_period
FROM public.student_availability AS availability
CROSS JOIN LATERAL generate_series(540, 1170, 30) AS generated(slot_minutes)
WHERE
  (availability.time_period = 'morning' AND slot_minutes >= 540 AND slot_minutes < 720)
  OR (availability.time_period = 'midday' AND slot_minutes >= 720 AND slot_minutes < 840)
  OR (availability.time_period = 'afternoon' AND slot_minutes >= 840 AND slot_minutes < 1020)
  OR (availability.time_period = 'late_afternoon' AND slot_minutes >= 1020 AND slot_minutes < 1200);

DELETE FROM public.student_availability;

ALTER TABLE public.student_availability
  DROP CONSTRAINT IF EXISTS student_availability_time_period_check;

ALTER TABLE public.student_availability
  ADD CONSTRAINT student_availability_time_period_check
  CHECK (time_period ~ '^(09|1[0-9]):(00|30)$');

INSERT INTO public.student_availability (student_id, day_of_week, time_period)
SELECT student_id, day_of_week, time_period
FROM migrated_student_availability;

COMMIT;
