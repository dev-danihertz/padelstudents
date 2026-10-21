/**
 * Authentication Module (Supabase Auth)
 * 
 * Provides helper functions for logging in, registering, signing out,
 * and listening for user session changes.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Sign in using email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ user, session, error }>}
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured yet. Check your .env file.') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  return { data, error };
}

/**
 * Register a new coach account with email and password
 * (Initially used to create your single-user coach account)
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ user, session, error }>}
 */
export async function signUp(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase is not configured yet. Check your .env file.') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  return { data, error };
}

/**
 * Sign out the currently active coach session
 * @returns {Promise<{ error }>}
 */
export async function signOut() {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current active session, if one exists
 * @returns {Promise<{ session, error }>}
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { session: null }, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Listen for authentication changes (e.g. login, logout, token refresh)
 * @param {Function} callback - called with (event, session)
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
