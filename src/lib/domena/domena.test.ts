import { describe, it, expect } from 'vitest';
import produkty from '$lib/dane/produkty.json';
import type { Produkty } from './typy';
import {
	wyliczSkladke,
	wariantyNiemonotoniczne,
	znajdzBranze,
	formatujSwiadczenie,
	formatujZl
} from './skladka';
import { peselPoprawny, zPesela, pelneLata, parsujListe, doAgregatu, wZakresieWieku } from './pesel';
import { nipPoprawny } from './nip';

const db = produkty as unknown as Produkty;
const DZIS = new Date(2026, 6, 13); // 13.07.2026

describe('skladka', () => {
	it('pakiet główny bez rozszerzeń: koszt pewny, widełki zerowe', () => {
		const w = wyliczSkladke(db, 'beauty', 0, { medi: [], gd: false, pakiety: {} }, 10, 0.5);
		expect(w.baza).toBe(58);
		expect(w.min).toBe(580);
		expect(w.max).toBe(580);
		expect(w.szacunek).toBe(580);
	});

	it('rozszerzenia tworzą widełki i szacunek wg adopcji', () => {
		// beauty W1 (58) + assistance medyczny (3.00) + Pakiet Życie WIII (20), 10 osób, adopcja 50%
		const w = wyliczSkladke(
			db,
			'beauty',
			0,
			{ medi: ['assistance-medyczny'], gd: false, pakiety: { zycie: 2 } },
			10,
			0.5
		);
		expect(w.sumaOpcji).toBe(23);
		expect(w.min).toBe(580);
		expect(w.max).toBe(810); // (58+23)*10
		expect(w.szacunek).toBe(695); // 580 + 23*10*0.5
	});

	it('Global Doctors dolicza 135 zł/os.', () => {
		const w = wyliczSkladke(db, 'ksiegowosc', 1, { medi: [], gd: true, pakiety: {} }, 4, 1);
		expect(w.baza).toBe(70);
		expect(w.max).toBe((70 + 135) * 4);
	});

	it('stomatologia jest niemonotoniczna, budownictwo nie', () => {
		expect(wariantyNiemonotoniczne(znajdzBranze(db, 'stomatologia')!)).toBe(true);
		expect(wariantyNiemonotoniczne(znajdzBranze(db, 'budownictwo')!)).toBe(false);
	});

	it('nieznana branża rzuca błąd', () => {
		expect(() => wyliczSkladke(db, 'nie-ma', 0, { medi: [], gd: false, pakiety: {} }, 2, 0)).toThrow();
	});

	it('formatowanie: do/1%/dzień', () => {
		const nbsp = (11000).toLocaleString('pl-PL'); // separator tysięcy zależny od ICU
		expect(formatujSwiadczenie(db, 'pz_max', 11000)).toBe(`do ${nbsp} zł`);
		expect(formatujSwiadczenie(db, 'tu_nw', 650)).toBe('650 zł / 1%');
		expect(formatujSwiadczenie(db, 'szpital_choroba', 90)).toBe('90 zł / dzień');
		expect(formatujSwiadczenie(db, 'zgon', null)).toBe('—');
		expect(formatujZl(58.5)).toBe('58,50 zł');
	});

	it('każda branża ma 3 składki i spójne tablice świadczeń', () => {
		for (const b of db.branze) {
			expect(b.skladka).toHaveLength(3);
			for (const [kod, wart] of Object.entries(b.s)) {
				expect(db.swiadczenia[kod], `brak metadanych świadczenia ${kod} (${b.slug})`).toBeDefined();
				expect(wart).toHaveLength(3);
			}
		}
	});
});

describe('pakiety dodatkowe', () => {
	it('każdy kod świadczenia pakietu ma etykietę (nie surowy kod)', async () => {
		const { tabelaPakietu } = await import('./pakiety');
		for (const p of db.pakiety_dodatkowe) {
			for (const w of tabelaPakietu(db, p)) {
				expect(w.etykieta, `brak etykiety dla ${w.kod} (${p.slug})`).not.toBe(w.kod);
				expect(w.wartosci).toHaveLength(3);
			}
		}
	});

	it('formatuje kwoty, dniówki i pozycje bezkwotowe', async () => {
		const { tabelaPakietu } = await import('./pakiety');
		const zdrowie = db.pakiety_dodatkowe.find((p) => p.slug === 'zdrowie-5')!;
		const wiersze = tabelaPakietu(db, zdrowie);
		const szpital = wiersze.find((w) => w.kod === 'szpital_choroba_90')!;
		expect(szpital.wartosci[0]).toBe('40 zł / dzień');
		expect(szpital.dni).toBe('1–90');
		const assist = wiersze.find((w) => w.kod === 'assistance_chorobowy')!;
		expect(assist.wartosci).toEqual(['✓ w pakiecie', '✓ w pakiecie', '✓ w pakiecie']);
		const pz = wiersze.find((w) => w.kod === 'pz_max')!;
		expect(pz.wartosci[2]).toMatch(/^do 20/);
	});

	it('mapowanie marketing→cennik wskazuje istniejące pakiety', async () => {
		const { MAPA_MARKETING_CENNIK } = await import('./pakiety');
		for (const slug of Object.values(MAPA_MARKETING_CENNIK)) {
			expect(db.pakiety_dodatkowe.some((p) => p.slug === slug), slug).toBe(true);
		}
	});
});

describe('pesel', () => {
	it('suma kontrolna', () => {
		expect(peselPoprawny('85031255515')).toBe(true);
		expect(peselPoprawny('85031255516')).toBe(false); // demo z prototypu ma błędną sumę
		expect(peselPoprawny('1234')).toBe(false);
	});

	it('stulecia: 19xx i 20xx', () => {
		expect(zPesela('85031255516')!.data.getFullYear()).toBe(1985);
		expect(zPesela('01251500000')!.data.getFullYear()).toBe(2001); // mm=25 → 2000+
	});

	it('płeć z cyfry 10.', () => {
		expect(zPesela('85031255516')!.plec).toBe('M'); // 1 → nieparzysta → M
	});

	it('odrzuca nieistniejące daty', () => {
		expect(zPesela('99023000000')).toBeNull(); // 30 lutego
	});

	it('pełne lata liczone po dacie, nie po roku', () => {
		expect(pelneLata(new Date(1990, 6, 14), DZIS)).toBe(35); // urodziny jutro
		expect(pelneLata(new Date(1990, 6, 13), DZIS)).toBe(36); // urodziny dziś
	});

	it('parsuje trzy formaty i raportuje błędy', () => {
		const { osoby, bledy } = parsujListe('85031255515\n2001-05-15 K\n1978 M\nxyz\n', DZIS);
		expect(osoby).toHaveLength(3);
		expect(bledy).toHaveLength(1);
		expect(osoby[1]).toMatchObject({ plec: 'K', wiek: 25 });
		expect(osoby[2]).toMatchObject({ plec: 'M', wiek: 48 });
	});

	it('agregat nie zawiera nic ponad rok/płeć/liczbę', () => {
		const { osoby } = parsujListe('1990 K\n1990 K\n1990 M', DZIS);
		const a = doAgregatu(osoby);
		expect(a).toEqual([
			{ rok: 1990, plec: 'K', liczba: 2 },
			{ rok: 1990, plec: 'M', liczba: 1 }
		]);
	});

	it('filtr wieku 15–70', () => {
		const { osoby } = parsujListe('2015 K\n1950 M\n1990 K', DZIS);
		expect(wZakresieWieku(osoby)).toHaveLength(1);
	});
});

describe('nip', () => {
	it('poprawny i błędny NIP', () => {
		expect(nipPoprawny('5252248481')).toBe(true); // znany poprawny NIP
		expect(nipPoprawny('525-224-84-81')).toBe(true); // z separatorami
		expect(nipPoprawny('5252248482')).toBe(false);
		expect(nipPoprawny('123')).toBe(false);
	});
});
