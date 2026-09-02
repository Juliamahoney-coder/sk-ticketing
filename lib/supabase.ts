import { createClient } from "@supabase/supabase-js";

export const ATTACHMENTS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "ticket-attachments";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client using the service role key — bypasses
 * Storage RLS entirely. This is safe because every call site already
 * went through our own ticket/comment visibility checks first; the
 * bucket stays private and files are only ever exposed via short-lived
 * signed URLs, never a public bucket URL.
 *
 * Null when Supabase env vars aren't configured (e.g. plain local dev
 * without a Supabase project set up yet) — callers must handle that.
 */
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;
