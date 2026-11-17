/**
 * Świadczenia pakietów dodatkowych: metadane kodów, których nie ma w katalogu
 * świadczeń pakietu głównego (produkty.json → swiadczenia), oraz formatowanie
 * wartości do tabel „Świadczenie × Wariant I–III".
 */
import type { Produkty, PakietDodatkowy } from './typy';
import { formatujZl } from './skladka';

interface MetaPakietowa {
	l: string;
	u: 'pln' | 'pln_1pct' | 'pln_dzien' | 'bool';
	max?: boolean;
	dni?: string;
}

/** Kody występujące wyłącznie w pakietach dodatkowych. */
const WLASNE: Record<string, MetaPakietowa> = {
	szpital_choroba_90: { l: 'Leczenie szpitalne — choroba', u: 'pln_dzien', dni: '1–90' },
	assistance_chorobowy: { l: 'Assistance chorobowy (Tabele 7–8 OWU MediOpieki)', u: 'bool' },
	szpital_nw_90: { l: 'Leczenie szpitalne — nieszczęśliwy wypadek', u: 'pln_dzien', dni: '1–90' },
	operacja_nw: { l: 'Operacja chirurgiczna w wyniku NW', u: 'pln' },
	powiklania_nw: { l: 'Powikłania pooperacyjne (NW)', u: 'pln' },
	szpital_nowotwor_90: { l: 'Leczenie szpitalne — choroba nowotworowa', u: 'pln_dzien', dni: '1–90' },
	assistance_onkologiczny: { l: 'Assistance onkologiczny', u: 'bool' },
	szpital_zawal_udar_90: {
		l: 'Leczenie szpitalne — zawał serca lub udar mózgu',
		u: 'pln_dzien',
		dni: '1–90'
	},
	teleopieka_kardiologiczna: { l: 'Teleopieka kardiologiczna (zestaw EKG)', u: 'bool' },
	tu_dziecka_nw: { l: 'Trwały uszczerbek dziecka w wyniku NW', u: 'pln_1pct' },
	tu_dziecka_komunikacyjny: {
		l: 'Trwały uszczerbek dziecka — wypadek komunikacyjny',
		u: 'pln_1pct'
	},
	szpital_dziecka_nw_90: { l: 'Leczenie szpitalne dziecka — NW', u: 'pln_dzien', dni: '1–90' },
	tu_malzonka_nw: { l: 'Trwały uszczerbek małżonka w wyniku NW', u: 'pln_1pct' },
	tu_malzonka_komunikacyjny: {
		l: 'Trwały uszczerbek małżonka — wypadek komunikacyjny',
		u: 'pln_1pct'
	},
	szpital_malzonka_nw_90: { l: 'Leczenie szpitalne małżonka — NW', u: 'pln_dzien', dni: '1–90' },
	operacja_malzonka_nw: { l: 'Operacja chirurgiczna małżonka w wyniku NW', u: 'pln' },
	powiklania_malzonka_nw: { l: 'Powikłania pooperacyjne małżonka (NW)', u: 'pln' }
};

/** Metadane kodu pakietowego: najpierw katalog główny, potem kody własne pakietów. */
export function metaPakietowa(db: Produkty, kod: string): MetaPakietowa {
	const glowna = db.swiadczenia[kod];
	if (glowna) return { l: glowna.l, u: glowna.u, max: glowna.max, dni: glowna.dni };
	return WLASNE[kod] ?? { l: kod, u: 'pln' };
}

export function formatujWartoscPakietu(
	db: Produkty,
	kod: string,
	wartosc: number | boolean | null
): string {
	if (wartosc == null) return '—';
	const m = metaPakietowa(db, kod);
	if (m.u === 'bool' || typeof wartosc === 'boolean') return wartosc ? '✓ w pakiecie' : '—';
	let s = formatujZl(wartosc);
	if (m.max) s = 'do ' + s;
	if (m.u === 'pln_1pct') s += ' / 1%';
	if (m.u === 'pln_dzien') s += ' / dzień';
	return s;
}

export interface WierszPakietu {
	kod: string;
	etykieta: string;
	dni?: string;
	wartosci: [string, string, string];
}

/** Wiersze tabeli świadczeń pakietu dodatkowego (Wariant I–III). */
export function tabelaPakietu(db: Produkty, pakiet: PakietDodatkowy): WierszPakietu[] {
	return Object.entries(pakiet.s).map(([kod, wart]) => {
		const m = metaPakietowa(db, kod);
		const w = wart as (number | boolean | null)[];
		return {
			kod,
			etykieta: m.l,
			dni: m.dni,
			wartosci: [0, 1, 2].map((i) => formatujWartoscPakietu(db, kod, w[i] ?? null)) as [
				string,
				string,
				string
			]
		};
	});
}

/** Marketingowy slug (zakładka Pakiety) → slug cennika; sumy wersji -3 i -5 są identyczne. */
export const MAPA_MARKETING_CENNIK: Record<string, string> = {
	zycie: 'zycie',
	zdrowie: 'zdrowie-5',
	wypadek: 'wypadek-5',
	onkologiczny: 'onkologiczny',
	kardiologiczny: 'kardiologiczny',
	'dziecko-nw': 'dziecko-nw-5',
	'malzonek-nw': 'malzonek-nw-5'
};
