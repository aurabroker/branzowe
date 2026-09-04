import type { Handle } from '@sveltejs/kit';

/**
 * Kroki lejka poza indeksem wyszukiwarek.
 *
 * Same strony mają w <head> `<meta name="robots" content="noindex">`, ale
 * /wniosek działa bez SSR (ssr = false), więc ten znacznik pojawia się dopiero
 * po hydracji i nie ma go w pierwszym HTML. Nagłówek X-Robots-Tag działa
 * niezależnie od renderowania i jest tu właściwym mechanizmem.
 */
const POZA_INDEKSEM = ['/wniosek'];

export const handle: Handle = async ({ event, resolve }) => {
	const odp = await resolve(event);
	const sciezka = event.url.pathname;
	if (POZA_INDEKSEM.some((p) => sciezka === p || sciezka.startsWith(p + '/'))) {
		odp.headers.set('x-robots-tag', 'noindex, follow');
	}
	return odp;
};
