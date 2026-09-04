/**
 * Źródło wizyty (atrybucja kampanii). Zapisywane przy pierwszym wejściu w sesji
 * i dołączane do wniosku, żeby dało się powiedzieć, który landing sprzedaje.
 *
 * Zasada „first touch": liczy się wejście, które rozpoczęło sesję. Późniejsze
 * przejścia po serwisie (np. landing → kreator) nie nadpisują źródła.
 *
 * Zbieramy wyłącznie parametry kampanii, identyfikatory kliknięcia, adres strony
 * wejścia i domenę odsyłającą. Żadnych danych osobowych, żadnych ciasteczek —
 * sessionStorage, znika razem z kartą, tak jak reszta stanu kreatora.
 */

const KLUCZ = 'ezb-zrodlo-v1';

/** Parametry przepisywane 1:1 z adresu wejścia. */
export const PARAMETRY = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
	'gclid',
	'fbclid',
	'msclkid'
] as const;

/** Limit długości wartości — dłuższe obcinamy zamiast odrzucać. */
export const MAX_DLUGOSC = 200;

export type Zrodlo = Partial<Record<(typeof PARAMETRY)[number], string>> & {
	/** ścieżka strony, na którą użytkownik wszedł jako pierwszą */
	wejscie?: string;
	/** domena odsyłająca (sam host, bez ścieżki i parametrów) */
	skad?: string;
	/** znacznik czasu pierwszego wejścia */
	ts?: string;
};

/** Usuwa znaki sterujące i przycina do limitu. */
export function oczysc(v: string): string {
	return v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, MAX_DLUGOSC);
}

/** Sam host odsyłającego; pusty dla wejść bezpośrednich i z tej samej domeny. */
export function hostOdsylajacego(referrer: string, wlasnyHost: string): string {
	if (!referrer) return '';
	try {
		const h = new URL(referrer).host;
		return h && h !== wlasnyHost ? h : '';
	} catch {
		return '';
	}
}

/** Buduje rekord źródła z adresu wejścia; null, gdy wejście nic nie niesie. */
export function zbudujZrodlo(url: URL, referrer: string): Zrodlo | null {
	const z: Zrodlo = {};
	for (const p of PARAMETRY) {
		const v = url.searchParams.get(p);
		if (v) z[p] = oczysc(v);
	}
	const skad = hostOdsylajacego(referrer, url.host);
	if (skad) z.skad = oczysc(skad);

	// Wejście bezpośrednie bez kampanii i bez odsyłającego nie niesie informacji —
	// nie zapisujemy pustego rekordu, żeby nie zablokować pierwszego sensownego
	// wejścia w tej samej sesji.
	if (Object.keys(z).length === 0) return null;

	z.wejscie = oczysc(url.pathname);
	z.ts = new Date().toISOString();
	return z;
}

/**
 * Zapisuje źródło, jeśli sesja jeszcze go nie ma. Wywoływane z layoutu przy
 * każdej nawigacji; bezpieczne wielokrotnie i przy zablokowanym storage.
 */
export function zapamietajZrodlo(url: URL, referrer: string): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		if (sessionStorage.getItem(KLUCZ)) return; // first touch wygrywa
		const z = zbudujZrodlo(url, referrer);
		if (z) sessionStorage.setItem(KLUCZ, JSON.stringify(z));
	} catch {
		// prywatny tryb przeglądarki albo zablokowany storage — atrybucja jest
		// dodatkiem i nigdy nie może wywrócić strony
	}
}

/** Odczytuje zapamiętane źródło; null, gdy nic nie zapisano. */
export function odczytajZrodlo(): Zrodlo | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const s = sessionStorage.getItem(KLUCZ);
		return s ? (JSON.parse(s) as Zrodlo) : null;
	} catch {
		return null;
	}
}
