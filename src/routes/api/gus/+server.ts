import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nipPoprawny, czystyNip } from '$lib/domena/nip';
import { szukajPoNip, GusBrakFirmy, GusAwaria } from '$lib/serwer/gus';

const CACHE_TTL_S = 86400; // NIP-y powtarzają się przy powrotach do formularza

export const GET: RequestHandler = async ({ url, platform }) => {
	const nip = czystyNip(url.searchParams.get('nip') ?? '');
	if (!nipPoprawny(nip)) error(400, 'Nieprawidłowy NIP');
	const klucz = platform?.env?.GUS_API_KEY;
	if (!klucz) error(503, 'Brak konfiguracji API REGON');

	const cache = platform?.caches?.default;
	const kluczCache = new Request(`https://cache.internal/gus/${nip}`);
	if (cache) {
		const trafienie = await cache.match(kluczCache);
		if (trafienie) return trafienie;
	}

	try {
		const firma = await szukajPoNip(nip, klucz);
		const odp = json(firma, {
			headers: { 'cache-control': `public, max-age=${CACHE_TTL_S}` }
		});
		if (cache) await cache.put(kluczCache, odp.clone());
		return odp;
	} catch (e) {
		if (e instanceof GusBrakFirmy) error(404, 'Nie znaleziono firmy w rejestrze REGON');
		if (e instanceof GusAwaria) error(502, 'Rejestr REGON nie odpowiada');
		throw e;
	}
};
