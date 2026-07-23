import type { Produkty, Branza, WariantIdx, WyborRozszerzen } from './typy';

export interface PozycjaOpcjonalna {
	nazwa: string;
	/** składka miesięczna za osobę */
	skladka: number;
}

export interface Wyliczenie {
	/** pakiet główny / os. / mies. — gwarantowana */
	baza: number;
	/** rozszerzenia udostępnione zespołowi */
	opcje: PozycjaOpcjonalna[];
	/** suma składek rozszerzeń / os. / mies. przy pełnej adopcji */
	sumaOpcji: number;
	/** koszt pewny firmy / mies. (baza × osoby) */
	min: number;
	/** koszt maksymalny / mies. (pełna adopcja) */
	max: number;
	/** szacunek / mies. przy założonej adopcji */
	szacunek: number;
}

export const RZYMSKIE = ['I', 'II', 'III'] as const;

export function formatujZl(n: number): string {
	return (
		n.toLocaleString('pl-PL', {
			minimumFractionDigits: n % 1 ? 2 : 0,
			maximumFractionDigits: 2
		}) + ' zł'
	);
}

/** Format kwoty świadczenia zgodnie z metadanymi (do/1%/dzień). */
export function formatujSwiadczenie(db: Produkty, kod: string, wartosc: number | null): string {
	if (wartosc == null) return '—';
	const m = db.swiadczenia[kod];
	let s = formatujZl(wartosc);
	if (m?.max) s = 'do ' + s;
	if (m?.u === 'pln_1pct') s += ' / 1%';
	if (m?.u === 'pln_dzien') s += ' / dzień';
	return s;
}

export function znajdzBranze(db: Produkty, slug: string): Branza | undefined {
	return db.branze.find((b) => b.slug === slug);
}

/** Lista pozycji opcjonalnych (rozszerzeń) z wybranego zestawu. */
export function pozycjeOpcjonalne(db: Produkty, wybor: WyborRozszerzen): PozycjaOpcjonalna[] {
	const opcje: PozycjaOpcjonalna[] = [];
	for (const m of db.mediopieka) {
		if (wybor.medi.includes(m.slug)) opcje.push({ nazwa: m.nazwa, skladka: m.skladka });
	}
	if (wybor.gd) opcje.push({ nazwa: db.global_doctors.nazwa, skladka: db.global_doctors.skladka });
	for (const [slug, wi] of Object.entries(wybor.pakiety)) {
		const p = db.pakiety_dodatkowe.find((x) => x.slug === slug);
		if (!p) continue;
		opcje.push({ nazwa: `${p.nazwa} · W${RZYMSKIE[wi]}`, skladka: p.skladka[wi] });
	}
	return opcje;
}

/**
 * Wyliczenie składki — ta sama logika po stronie klienta (pasek/podsumowanie)
 * i serwera (weryfikacja wniosku). Pakiet główny jest pewny; rozszerzenia
 * wybiera pracownik w deklaracji, więc koszt firmy to widełki [min, max]
 * plus szacunek przy założonej adopcji.
 */
export function wyliczSkladke(
	db: Produkty,
	branzaSlug: string,
	wariant: WariantIdx,
	wybor: WyborRozszerzen,
	liczbaOsob: number,
	adopcja: number
): Wyliczenie {
	const b = znajdzBranze(db, branzaSlug);
	if (!b) throw new Error(`Nieznana branża: ${branzaSlug}`);
	if (adopcja < 0 || adopcja > 1) throw new Error('Adopcja poza zakresem 0–1');
	const baza = b.skladka[wariant];
	const opcje = pozycjeOpcjonalne(db, wybor);
	const sumaOpcji = opcje.reduce((a, x) => a + x.skladka, 0);
	const min = baza * liczbaOsob;
	const max = (baza + sumaOpcji) * liczbaOsob;
	const szacunek = min + sumaOpcji * liczbaOsob * adopcja;
	return { baza, opcje, sumaOpcji, min, max, szacunek };
}

/** Czy warianty branży są niemonotoniczne na zgonie (przypadek: stomatologia). */
export function wariantyNiemonotoniczne(b: Branza): boolean {
	const z = b.s.zgon;
	return z != null && z[2] != null && z[0] != null && z[2] > z[0];
}
