import { error } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';
import produkty from '$lib/dane/produkty.json';
import tresci from '$lib/dane/branze-landing.json';
import type { Produkty } from '$lib/domena/typy';
import { formatujSwiadczenie, formatujZl, wariantyNiemonotoniczne } from '$lib/domena/skladka';

export const prerender = true;

const DB = produkty as unknown as Produkty;

/** Wiersze tabeli „kluczowe świadczenia" — pełny katalog jest w /zakres-ochrony. */
const KLUCZOWE = [
	'zgon',
	'zgon_nw',
	'zgon_komunikacyjny',
	'zgon_w_pracy',
	'zgon_komunikacyjny_w_pracy',
	'tu_nw',
	'tu_w_pracy',
	'pz_max',
	'leczenie_spec',
	'szpital_choroba',
	'szpital_nw',
	'szpital_w_pracy',
	'operacja'
] as const;

interface Scenariusz {
	tytul: string;
	opis: string;
	etykieta: string;
	kwota: string;
}

interface TrescBranzy {
	naglowek: string;
	lead: string;
	kogo: string[];
	scenariusze: { kod: string; tytul: string; opis: string }[];
	seo_tytul: string;
	seo_opis: string;
}

/** '2026-07-01' → '1 lipca 2026' */
function dataPl(iso: string): string {
	return new Date(iso + 'T00:00:00Z').toLocaleDateString('pl-PL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

export const entries: EntryGenerator = () => DB.branze.map((b) => ({ slug: b.slug }));

export const load: PageLoad = ({ params }) => {
	const branza = DB.branze.find((b) => b.slug === params.slug);
	const tresc = (tresci as unknown as Record<string, TrescBranzy>)[params.slug];
	if (!branza || !tresc) error(404, 'Nie ma takiego programu branżowego');

	// Scenariusze pokazują sumę z Wariantu I. Kod bez wartości w tej branży jest
	// pomijany — nie wolno pokazać kwoty, której w tabeli branży nie ma.
	const scenariusze: Scenariusz[] = tresc.scenariusze
		.filter((s) => branza.s[s.kod]?.[0] != null)
		.map((s) => ({
			tytul: s.tytul,
			opis: s.opis,
			etykieta: DB.swiadczenia[s.kod].l,
			kwota: formatujSwiadczenie(DB, s.kod, branza.s[s.kod][0])
		}));

	const wiersze = KLUCZOWE.filter((kod) => branza.s[kod]?.some((v) => v != null)).map((kod) => ({
		etykieta: DB.swiadczenia[kod].l,
		karencja: DB.swiadczenia[kod].k,
		wartosci: branza.s[kod].map((v) => formatujSwiadczenie(DB, kod, v))
	}));

	return {
		slug: branza.slug,
		nazwa: branza.nazwa,
		opis: branza.opis,
		naglowek: tresc.naglowek,
		lead: tresc.lead,
		kogo: tresc.kogo,
		seo_tytul: tresc.seo_tytul.replace('{od}', formatujZl(Math.min(...branza.skladka))),
		seo_opis: tresc.seo_opis,
		skladki: branza.skladka.map((s) => formatujZl(s)),
		skladkaOd: formatujZl(Math.min(...branza.skladka)),
		niemonotoniczne: wariantyNiemonotoniczne(branza),
		scenariusze,
		wiersze,
		warunki: DB.meta.warunki_wejscia,
		obowiazuje: {
			od: dataPl(DB.meta.skladki_obowiazuja.branze_od),
			do: dataPl(DB.meta.skladki_obowiazuja.branze_do)
		}
	};
};
