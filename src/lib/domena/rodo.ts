/**
 * Walidacja negatywna RODO dla payloadu wniosku.
 *
 * Twarda zasada projektu: PESEL-e z kroku „struktura zespołu" są przeliczane
 * w przeglądarce i do API trafia wyłącznie agregat [{rok, plec, liczba}].
 * Ta funkcja jest siatką bezpieczeństwa na wypadek błędu w kodzie klienta —
 * odrzuca payload, w którym w jakimkolwiek napisie (wartości lub kluczu)
 * znajdzie ciąg 11 cyfr.
 *
 * Liczb nie sprawdzamy: składka liczona na liczbach zmiennoprzecinkowych daje
 * w JSON-ie np. 750.2249999999999 — 13 cyfr pod rząd, a to nie PESEL. Liczbą
 * PESEL do bazy nie trafi: każda liczba w schemacie ma wąski zakres (rok,
 * liczba osób, adopcja 0–1), a `skladka_klienta` służy tylko do porównania
 * z wyliczeniem serwera i nie jest zapisywana.
 *
 * Trzy pola są wyłączone, każde z konkretnego powodu:
 *  - `kontakt.telefon` — numer z prefiksem kraju to legalnie 11 cyfr,
 *  - `firma.regon` w formacie REGON-u — jednostka lokalna ma REGON
 *    14-cyfrowy; dokładnie 9 albo 14 cyfr nie może być PESEL-em (11),
 *  - `zrodlo_wizyty` — identyfikatory kliknięcia reklamowego (gclid, fbclid)
 *    bywają długimi ciągami z cyframi. To pole nie pochodzi z formularza:
 *    kreator wypełnia je wyłącznie parametrami adresu wejścia, więc nie ma
 *    drogi, którą trafiłyby tam dane pracowników.
 */

/** Wzorzec PESEL-a: jedenaście cyfr pod rząd. */
const eleven = /\d{11}/;

/** REGON: 9 cyfr (podmiot) albo 14 (jednostka lokalna). */
const formatRegon = /^\d{9}(\d{5})?$/;

export interface PayloadDoSprawdzenia {
	kontakt?: { telefon?: string };
	firma?: { regon?: string; [k: string]: unknown };
	zrodlo_wizyty?: unknown;
	[k: string]: unknown;
}

/** Wszystkie napisy w strukturze — wartości i klucze; liczby i booleany pomija. */
function napisy(w: unknown): string[] {
	if (typeof w === 'string') return [w];
	if (Array.isArray(w)) return w.flatMap(napisy);
	if (w && typeof w === 'object') return Object.entries(w).flatMap(([k, v]) => [k, ...napisy(v)]);
	return [];
}

export function zawieraPesel(dane: PayloadDoSprawdzenia): boolean {
	const kopia = structuredClone(dane) as PayloadDoSprawdzenia;
	if (kopia.kontakt) kopia.kontakt.telefon = '';
	if (kopia.firma && formatRegon.test(kopia.firma.regon ?? '')) kopia.firma.regon = '';
	kopia.zrodlo_wizyty = null;
	return napisy(kopia).some((s) => eleven.test(s));
}
