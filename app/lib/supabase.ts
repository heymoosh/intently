import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loud in dev — a silent misconfig wastes the first 20 minutes of debugging.
  throw new Error(
    'Supabase env missing. Copy app/.env.example to app/.env, fill in the anon key, restart Expo.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Sessions are not persisted yet — auth flow lands with the Managed Agents wiring.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
