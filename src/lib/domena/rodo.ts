/**
 * Walidacja negatywna RODO dla payloadu wniosku.
 *
 * Twarda zasada projektu: PESEL-e z kroku „struktura zespołu" są przeliczane
 * w przeglądarce i do API trafia wyłącznie agregat [{rok, plec, liczba}].
 * Ta funkcja jest siatką bezpieczeństwa na wypadek błędu w kodzie klienta —
 * odrzuca payload, w którym gdziekolwiek znajdzie ciąg 11 cyfr.
 *
 * Dwa pola są z niej wyłączone, każde z konkretnego powodu:
 *  - `kontakt.telefon` — numer z prefiksem kraju to legalnie 11 cyfr,
 *  - `zrodlo_wizyty` — identyfikatory kliknięcia reklamowego (gclid, fbclid)
 *    bywają długimi ciągami z cyframi. To pole nie pochodzi z formularza:
 *    kreator wypełnia je wyłącznie parametrami adresu wejścia, więc nie ma
 *    drogi, którą trafiłyby tam dane pracowników.
 */

/** Wzorzec PESEL-a: jedenaście cyfr pod rząd. */
const eleven = /\d{11}/;

export interface PayloadDoSprawdzenia {
	kontakt?: { telefon?: string };
	zrodlo_wizyty?: unknown;
	[k: string]: unknown;
}

export function zawieraPesel(dane: PayloadDoSprawdzenia): boolean {
	const kopia = structuredClone(dane) as PayloadDoSprawdzenia;
	if (kopia.kontakt) kopia.kontakt.telefon = '';
	kopia.zrodlo_wizyty = null;
	return eleven.test(JSON.stringify(kopia));
}
