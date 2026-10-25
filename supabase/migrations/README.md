# Supabase Database Migrations
This directory will store version-controlled SQL migration scripts for the Padel Coach CRM PostgreSQL database.

Apply migrations in numerical order. `03_remove_lesson_theme_category.sql` removes the unused `category` column from `public.lesson_themes` while preserving existing themes. `04_allow_sunday_availability.sql` allows Sunday as its own availability day in `public.student_availability`. `05_student_completed_themes.sql` creates the student-to-completed-theme relationship. `06_half_hour_student_availability.sql` stores student availability in individual half-hour slots from 09:00 to 20:00. `07_grant_authenticated_table_access.sql` grants authenticated users the required SQL table privileges while leaving row access controlled by RLS policies.

In **Phase 2**, we will create:
- `01_initial_schema.sql`: Tables (`students`, `student_availability`, `student_lesson_preferences`, `student_contact_history`).
- Enums and constraints (level ranges, membership status, student status).
- Row Level Security (RLS) policies ensuring only your authenticated coach account can access private student data.
