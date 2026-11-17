/** Typy odwzorowujące strukturę dane/produkty.json (jedno źródło prawdy cennika). */

export type WariantIdx = 0 | 1 | 2;

export interface MetaSwiadczenia {
	/** etykieta */
	l: string;
	/** grupa (klucz w Produkty.grupy) */
	g: string;
	/** jednostka: pln | pln_1pct | pln_dzien */
	u: 'pln' | 'pln_1pct' | 'pln_dzien';
	/** karencja, np. "brak", "6 miesięcy" */
	k: string;
	/** kwota jest górnym limitem ("do …") */
	max?: boolean;
	/** zakres dni dla świadczeń dziennych */
	dni?: string;
}

export interface Branza {
	slug: string;
	nazwa: string;
	opis: string;
	kod_ulotki: string;
	/** składka miesięczna za osobę w wariantach I–III */
	skladka: [number, number, number];
	/** część składki przeznaczona na zgon */
	skladka_zgon: [number, number, number];
	uwaga?: string;
	/** sumy świadczeń: kod → [WI, WII, WIII]; null = brak w wariancie */
	s: Record<string, [number | null, number | null, number | null]>;
}

export interface PozycjaMediopieki {
	slug: string;
	nazwa: string;
	skladka: number;
	obejmuje: string[];
	opis?: string;
	limit_roczny?: number;
	swiadczenia?: { n: string; v: string }[];
	wersje_dla_bliskich?: string[];
	warianty?: unknown[];
}

export interface PakietDodatkowy {
	nr: number;
	slug: string;
	nazwa: string;
	podgrupy_operacji: number | null;
	skladka: [number, number, number];
	zgodny_z_pakietem_glownym?: boolean;
	uwaga?: string;
	dla_kogo?: string;
	s: Record<string, unknown>;
}

export interface Produkty {
	meta: {
		produkt: string;
		ubezpieczyciel: string;
		owu: Record<string, string>;
		skladki_obowiazuja: { branze_od: string; branze_do: string; pakiety_dodatkowe_do: string };
		warunki_wejscia: {
			zatrudnienie_min: number;
			zatrudnienie_max: number;
			wiek_pracownika_min: number;
			wiek_pracownika_max: number;
			bliscy: string[];
			segment: string;
		};
		podgrupy_operacji_pakiet_glowny: number;
		uwagi: string[];
	};
	swiadczenia: Record<string, MetaSwiadczenia>;
	grupy: Record<string, string>;
	branze: Branza[];
	mediopieka: PozycjaMediopieki[];
	global_doctors: {
		nazwa: string;
		skladka: number;
		suma_ubezpieczenia: string;
		zgon_ubezpieczonego: number;
		wiek: { min: number; max: number };
		[k: string]: unknown;
	};
	pakiety_dodatkowe: PakietDodatkowy[];
}

/** Wybory z kreatora — stan wysyłany do /api/wnioski (bez danych osobowych pracowników). */
export interface WyborRozszerzen {
	/** slugi MediOpieki */
	medi: string[];
	/** Global Doctors */
	gd: boolean;
	/** pakiety dodatkowe: slug → indeks wariantu 0–2 */
	pakiety: Record<string, WariantIdx>;
}

/** Agregat struktury wiekowej — JEDYNE, co opuszcza przeglądarkę z kroku „struktura". */
export interface PozycjaStruktury {
	rok: number;
	plec: 'K' | 'M';
	liczba: number;
}
