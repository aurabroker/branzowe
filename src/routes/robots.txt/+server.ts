import type { RequestHandler } from './$types';
import { BAZA_URL } from '$lib/adres';

export const prerender = true;

/**
 * Celowo bez `Disallow` dla /wniosek. Kreator ma być wykluczony z indeksu,
 * ale zakaz w robots.txt zablokowałby robotowi wejście na stronę, więc nigdy
 * nie zobaczyłby tam znacznika `noindex` — a sam adres i tak mógłby trafić do
 * wyników z linków. Wykluczenie realizuje `noindex` w <head> tych stron.
 */
const TRESC = `User-agent: *
Allow: /

Sitemap: ${BAZA_URL}/sitemap.xml
`;

export const GET: RequestHandler = () =>
	new Response(TRESC, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=86400'
		}
	});
