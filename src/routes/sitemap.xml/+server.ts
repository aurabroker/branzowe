import type { RequestHandler } from './$types';
import produkty from '$lib/dane/produkty.json';
import { ZAKLADKI } from '$lib/komponenty/zakres/zakladki';
import { BAZA_URL } from '$lib/adres';

export const prerender = true;

interface Wpis {
	sciezka: string;
	priorytet: string;
	czestotliwosc: 'weekly' | 'monthly' | 'yearly';
}

/**
 * Do mapy trafiają wyłącznie strony treściowe. Kreator (/wniosek) i ekran
 * potwierdzenia są krokami lejka, nie stronami docelowymi — mają noindex
 * i celowo ich tu nie ma.
 */
const STRONY: Wpis[] = [
	{ sciezka: '/', priorytet: '1.0', czestotliwosc: 'weekly' },
	...produkty.branze.map(
		(b): Wpis => ({ sciezka: `/branza/${b.slug}`, priorytet: '0.9', czestotliwosc: 'weekly' })
	),
	...ZAKLADKI.map(
		(z): Wpis => ({
			sciezka: `/zakres-ochrony/${z.slug}`,
			priorytet: '0.7',
			czestotliwosc: 'monthly'
		})
	),
	{ sciezka: '/dokumenty', priorytet: '0.5', czestotliwosc: 'monthly' },
	{ sciezka: '/o-nas', priorytet: '0.4', czestotliwosc: 'yearly' },
	{ sciezka: '/regulamin', priorytet: '0.2', czestotliwosc: 'yearly' },
	{ sciezka: '/rodo', priorytet: '0.2', czestotliwosc: 'yearly' }
];

export const GET: RequestHandler = () => {
	const dzis = new Date().toISOString().slice(0, 10);
	const wpisy = STRONY.map(
		(s) => `	<url>
		<loc>${BAZA_URL}${s.sciezka}</loc>
		<lastmod>${dzis}</lastmod>
		<changefreq>${s.czestotliwosc}</changefreq>
		<priority>${s.priorytet}</priority>
	</url>`
	).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${wpisy}
</urlset>
`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
