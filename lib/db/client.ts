import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only admin client using service role key — never exposed to browser
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
