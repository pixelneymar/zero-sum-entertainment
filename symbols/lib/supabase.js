// symbols/lib/supabase.js
//
// Creates the Supabase client and bootstraps anonymous auth.
//
// Division of authority (docs/architecture.md §1, docs/integrity.md §1):
// this file only ever talks to PostgREST/Auth through the public `anon` key.
// The anon key is DESIGNED to be public — RLS on the server is the actual
// security boundary, not secrecy of this key. The `service_role` key must
// NEVER appear anywhere under symbols/.
//
// The dev server resolves '@supabase/supabase-js' via an importmap
// (esm.sh 2.45.0), so this bare import works unmodified in the browser.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xgvuavikubqwsdhoadyw.supabase.co'

// Public anon key for project ref xgvuavikubqwsdhoadyw. Safe for client code
// — see note above. Fetched via:
//   supabase projects api-keys --project-ref xgvuavikubqwsdhoadyw -o json
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndnVhdmlrdWJxd3NkaG9hZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTQ0MTYsImV4cCI6MjEwMzMzMDQxNn0.GDOlD5NQF50uXUyKqQXXDbpJpJh6FKyLKjy1R8qatak'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
})

let userId = null

/**
 * Returns the signed-in user's id once auth has settled, else null.
 * Used by realtime.js to build the `user_id=eq.<uid>` filter.
 */
export function getUserId() {
  return userId
}

async function bootstrapAuth() {
  const { data: sessionData } = await supabase.auth.getSession()
  let session = sessionData ? sessionData.session : null

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    session = data ? data.session : null
  }

  userId = session && session.user ? session.user.id : null

  // Ensures a `profiles` row exists (and grants the 200-chip starting
  // balance, once) for this auth user. Safe to call on every load — the
  // server makes it idempotent, per docs/spec.md §6.
  const { error: profileError } = await supabase.rpc('ensure_profile')
  if (profileError) throw profileError

  return userId
}

// Kicked off at import time so every consumer of this module can just
// `await authReady` before making an authenticated call.
export const authReady = bootstrapAuth()

supabase.auth.onAuthStateChange((_event, session) => {
  if (session && session.user) userId = session.user.id
})
