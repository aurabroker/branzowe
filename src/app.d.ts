declare global {
	namespace App {
		interface Platform {
			env: {
				SUPABASE_URL: string;
				SUPABASE_SERVICE_ROLE_KEY: string;
				RESEND_API_KEY: string;
				MAIL_OD: string;
				MAIL_OPIEKUN: string;
				GUS_API_KEY: string;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
