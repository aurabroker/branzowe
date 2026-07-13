/**
 * Parsowanie listy osób do agregatu struktury wiekowej.
 *
 * TWARDA ZASADA (RODO): ten moduł wolno importować WYŁĄCZNIE w kodzie klienta.
 * PESEL-e i daty urodzenia nigdy nie opuszczają przeglądarki — do API trafia
 * jedynie agregat [{rok, plec, liczba}].
 */
import type { PozycjaStruktury } from './typy';

export const WIEK_MIN = 15;
export const WIEK_MAX = 70;

export interface Osoba {
	wiek: number;
	rokUrodzenia: number;
	plec: 'K' | 'M';
}

export interface WynikParsowania {
	osoby: Osoba[];
	bledy: { wiersz: string; powod: string }[];
}

export function peselPoprawny(p: string): boolean {
	if (!/^\d{11}$/.test(p)) return false;
	const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
	const s = w.reduce((a, x, i) => a + x * +p[i], 0);
	return (10 - (s % 10)) % 10 === +p[10];
}

/** Data urodzenia i płeć z PESEL; obsługuje stulecia 1800–2299. */
export function zPesela(p: string): { data: Date; plec: 'K' | 'M' } | null {
	const rr = +p.slice(0, 2);
	const mm = +p.slice(2, 4);
	const dd = +p.slice(4, 6);
	const stulecia: Record<number, number> = { 0: 1900, 20: 2000, 40: 2100, 60: 2200, 80: 1800 };
	const stulecie = stulecia[Math.floor(mm / 20) * 20];
	if (stulecie === undefined) return null;
	const miesiac = mm % 20;
	if (miesiac < 1 || miesiac > 12 || dd < 1 || dd > 31) return null;
	const data = new Date(stulecie + rr, miesiac - 1, dd);
	if (data.getMonth() !== miesiac - 1) return null; // np. 31 lutego
	return { data, plec: +p[9] % 2 ? 'M' : 'K' };
}

/** Pełne ukończone lata (nie dni/365). */
export function pelneLata(dataUr: Date, dzis: Date): number {
	let w = dzis.getFullYear() - dataUr.getFullYear();
	const m = dzis.getMonth() - dataUr.getMonth();
	if (m < 0 || (m === 0 && dzis.getDate() < dataUr.getDate())) w--;
	return w;
}

/**
 * Parsuje wklejony tekst: PESEL (11 cyfr) | "RRRR-MM-DD K/M" | "RRRR K/M",
 * jedna osoba na wiersz.
 */
export function parsujListe(txt: string, dzis: Date = new Date()): WynikParsowania {
	const osoby: Osoba[] = [];
	const bledy: WynikParsowania['bledy'] = [];
	for (const surowy of txt.split(/\r?\n/)) {
		const wiersz = surowy.trim();
		if (!wiersz) continue;
		const czyste = wiersz.replace(/[\s ]/g, '');
		let m: RegExpMatchArray | null;
		if (/^\d{11}$/.test(czyste)) {
			if (!peselPoprawny(czyste)) {
				bledy.push({ wiersz, powod: 'PESEL — błędna suma kontrolna' });
				continue;
			}
			const r = zPesela(czyste);
			if (!r) {
				bledy.push({ wiersz, powod: 'PESEL — nieprawidłowa data' });
				continue;
			}
			osoby.push({ wiek: pelneLata(r.data, dzis), rokUrodzenia: r.data.getFullYear(), plec: r.plec });
			continue;
		}
		if ((m = wiersz.match(/^(\d{4})-(\d{2})-(\d{2})\s*[;,\t ]\s*([KMkm])$/))) {
			const d = new Date(+m[1], +m[2] - 1, +m[3]);
			osoby.push({
				wiek: pelneLata(d, dzis),
				rokUrodzenia: d.getFullYear(),
				plec: m[4].toUpperCase() as 'K' | 'M'
			});
			continue;
		}
		if ((m = wiersz.match(/^(\d{4})\s*[;,\t ]\s*([KMkm])$/))) {
			osoby.push({
				wiek: dzis.getFullYear() - +m[1],
				rokUrodzenia: +m[1],
				plec: m[2].toUpperCase() as 'K' | 'M'
			});
			continue;
		}
		bledy.push({ wiersz, powod: 'nierozpoznany format' });
	}
	return { osoby, bledy };
}

/** Osoby w zakresie wieku programu. */
export function wZakresieWieku(osoby: Osoba[]): Osoba[] {
	return osoby.filter((o) => o.wiek >= WIEK_MIN && o.wiek <= WIEK_MAX);
}

/** Agregat rok urodzenia × płeć — jedyny kształt danych wysyłany na serwer. */
export function doAgregatu(osoby: Osoba[]): PozycjaStruktury[] {
	const mapa = new Map<string, PozycjaStruktury>();
	for (const o of osoby) {
		const k = `${o.plec}${o.rokUrodzenia}`;
		const poz = mapa.get(k);
		if (poz) poz.liczba++;
		else mapa.set(k, { rok: o.rokUrodzenia, plec: o.plec, liczba: 1 });
	}
	return [...mapa.values()].sort((a, b) => a.rok - b.rok || a.plec.localeCompare(b.plec));
}
