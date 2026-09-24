/**
 * Zdjęcia promocyjne pokazywane na ekranie „Wniosek przyjęty" (losowo, przy każdej wizycie).
 *
 * Aby dodać zdjęcie: wrzuć plik .jpg/.jpeg/.png/.webp/.avif do katalogu `src/lib/promo/`.
 * Wszystkie pliki z tego katalogu są wykrywane automatycznie w czasie budowania —
 * nie trzeba nic tu dopisywać ani utrzymywać listy nazw.
 */
const moduly = import.meta.glob('./promo/*.{jpg,jpeg,png,webp,avif}', {
	eager: true,
	query: '?url',
	import: 'default'
});

export type Promo = { src: string; href: string };

/** './promo/utrata-dochodu-03-programista.png' → 'programista' */
export function nazwaPromo(sciezka: string): string {
	return sciezka
		.replace(/^.*\//, '')
		.replace(/\.[^.]+$/, '')
		.replace(/^utrata-dochodu-/, '')
		.replace(/^\d+-/, '');
}

/** Link banera; utm_content niesie nazwę grafiki, by w analityce było widać, która działa. */
export function linkPromo(nazwa: string): string {
	return `https://utratadochodu.pl/?utm_source=partner&utm_medium=display&utm_campaign=permanentlink&utm_content=ergobranzowe-${encodeURIComponent(nazwa)}&utm_term=wniosek`;
}

export const PROMO: Promo[] = Object.entries(moduly).map(([sciezka, src]) => ({
	src: src as string,
	href: linkPromo(nazwaPromo(sciezka))
}));

/** Losowe zdjęcie promocyjne albo null, gdy katalog jest pusty. */
export function losowePromo(): Promo | null {
	if (PROMO.length === 0) return null;
	return PROMO[Math.floor(Math.random() * PROMO.length)];
}
