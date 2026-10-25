/**
 * Supabase Client Initialisation
 * 
 * Reads the environment variables from import.meta.env (provided by Vite)
 * and exports the official Supabase client instance.
 * 
 * Note: Vite only exposes environment variables to the browser if they
 * start with the prefix "VITE_".
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check whether real credentials have been provided in the local .env file
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !/your-(anon|publishable)/i.test(supabaseKey)
);

// If configured, create the client. Otherwise, export null with a warning.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, // Automatically saves the login session to browser storage
        autoRefreshToken: true // Automatically refreshes the session token in the background
      }
    })
  : null;
