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

export const PROMO: string[] = Object.values(moduly) as string[];

/** Losowe zdjęcie promocyjne albo null, gdy katalog jest pusty. */
export function losowePromo(): string | null {
	if (PROMO.length === 0) return null;
	return PROMO[Math.floor(Math.random() * PROMO.length)];
}
