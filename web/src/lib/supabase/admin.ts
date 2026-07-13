import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Client Supabase avec la clé service_role : contourne la RLS.
 * À utiliser UNIQUEMENT côté serveur, dans du code jamais atteignable
 * sans vérification préalable (ex. webhook Stripe après vérif de signature).
 * Ne jamais importer ce module depuis un composant client. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
