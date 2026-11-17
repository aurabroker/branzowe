/**
 * Banery promocyjne pokazywane na ekranie „Wniosek przyjęty" (losowo, przy każdej wizycie).
 *
 * Pliki leżą w `static/banery/` i mają stałe adresy (np. /banery/programista.png),
 * bo z tych samych adresów pobierają je inne serwisy — nie zmieniaj nazw istniejących plików.
 * Aby dodać baner: wrzuć plik do `static/banery/` i dopisz jego nazwę poniżej.
 */
const BANERY = [
	'programista.png',
	'balerina.png',
	'aktor.png',
	'architekt.png',
	'dentysta.png',
	'przedsiebiorca.png',
	'nurkowanie.png',
	'jacht.png',
	'narty.png',
	'rodzina.png',
	'podroze.png',
	'dom.png'
];

export const PROMO: string[] = BANERY.map((plik) => `/banery/${plik}`);

/** Losowe zdjęcie promocyjne albo null, gdy lista jest pusta. */
export function losowePromo(): string | null {
	if (PROMO.length === 0) return null;
	return PROMO[Math.floor(Math.random() * PROMO.length)];
}
