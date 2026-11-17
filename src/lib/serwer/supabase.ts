import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Klient Supabase z kluczem service role — wolno go tworzyć wyłącznie
 * po stronie serwera (sekrety Workera). Przeglądarka nigdy nie rozmawia
 * z Supabase bezpośrednio.
 */
export function supabaseAdmin(env: App.Platform['env']): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}
