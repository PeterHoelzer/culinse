import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER-ONLY.
 *
 * This bypasses Row-Level Security, so it must only ever be used for reads that
 * are explicitly scoped to public data (e.g. `is_public = true`). Never expose
 * the returned client or its key to the browser, and never use it to read
 * private rows.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
