# Supabase Database Migrations
This directory will store version-controlled SQL migration scripts for the Padel Coach CRM PostgreSQL database.

In **Phase 2**, we will create:
- `01_initial_schema.sql`: Tables (`students`, `student_availability`, `student_lesson_preferences`, `student_contact_history`).
- Enums and constraints (level ranges, membership status, student status).
- Row Level Security (RLS) policies ensuring only your authenticated coach account can access private student data.
