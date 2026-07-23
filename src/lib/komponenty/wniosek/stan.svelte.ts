/**
 * Stan kreatora wniosku (Svelte 5 runes). Strona /wniosek działa bez SSR
 * (ssr=false), więc singleton modułowy jest bezpieczny; mirror w
 * sessionStorage przeżywa odświeżenie, znika po zamknięciu karty.
 */
import produkty from '$lib/dane/produkty.json';
import type { Produkty, WariantIdx, PozycjaStruktury } from '$lib/domena/typy';
import { wyliczSkladke, type Wyliczenie } from '$lib/domena/skladka';

export const DB = produkty as unknown as Produkty;

export interface DaneGus {
	nip: string;
	nazwa: string;
	regon?: string;
	adres?: string;
	pkd_kod?: string;
	pkd_opis?: string;
	data_zawieszenia?: string;
	zrodlo: 'gus' | 'recznie';
}

export interface Statystyki {
	kobiety: number;
	mezczyzni: number;
	sredniWiek: number;
	kubelki: { od: number; do: number; ile: number }[];
	pozaWiekiem: number;
	nierozpoznane: { wiersz: string; powod: string }[];
}

const KLUCZ = 'ezb-wniosek-v1';

interface Zrzut {
	krok: number;
	branza: string | null;
	wariant: WariantIdx;
	medi: string[];
	gd: boolean;
	pakiety: Record<string, WariantIdx>;
	adopcja: number;
	tryb: 0 | 1;
	liczbaOsob: number;
	struktura: PozycjaStruktury[] | null;
	gus: DaneGus | null;
	kontakt: { imie: string; stanowisko: string; email: string; telefon: string; start: string };
	zgody: Record<string, boolean>;
}

function pusty(): Zrzut {
	return {
		krok: 1,
		branza: null,
		wariant: 0,
		medi: [],
		gd: false,
		pakiety: {},
		adopcja: 0.5,
		tryb: 0,
		liczbaOsob: 0,
		struktura: null,
		gus: null,
		kontakt: { imie: '', stanowisko: '', email: '', telefon: '', start: '' },
		zgody: {}
	};
}

class StanWniosku {
	krok = $state(1);
	branza = $state<string | null>(null);
	wariant = $state<WariantIdx>(0);
	medi = $state<string[]>([]);
	gd = $state(false);
	pakiety = $state<Record<string, WariantIdx>>({});
	pokaz3 = $state(false);
	adopcja = $state(0.5);
	tryb = $state<0 | 1>(0);
	liczbaOsob = $state(0);
	struktura = $state<PozycjaStruktury[] | null>(null);
	statystyki = $state<Statystyki | null>(null);
	gus = $state<DaneGus | null>(null);
	kontakt = $state({ imie: '', stanowisko: '', email: '', telefon: '', start: '' });
	zgody = $state<Record<string, boolean>>({});
	wysylka = $state<{ stan: 'brak' | 'trwa' | 'blad'; blad?: string }>({ stan: 'brak' });

	branzaObj = $derived(DB.branze.find((b) => b.slug === this.branza) ?? null);

	wyliczenie: Wyliczenie | null = $derived(
		this.branza
			? wyliczSkladke(
					DB,
					this.branza,
					this.wariant,
					{ medi: this.medi, gd: this.gd, pakiety: this.pakiety },
					this.liczbaOsob,
					this.adopcja
				)
			: null
	);

	idz(n: number) {
		if (n >= 2 && !this.branza) return;
		this.krok = n;
		this.zapisz();
		if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	zapisz() {
		if (typeof sessionStorage === 'undefined') return;
		const z: Zrzut = {
			krok: this.krok,
			branza: this.branza,
			wariant: this.wariant,
			medi: this.medi,
			gd: this.gd,
			pakiety: this.pakiety,
			adopcja: this.adopcja,
			tryb: this.tryb,
			liczbaOsob: this.liczbaOsob,
			struktura: this.struktura,
			gus: this.gus,
			kontakt: this.kontakt,
			zgody: this.zgody
		};
		sessionStorage.setItem(KLUCZ, JSON.stringify(z));
	}

	wczytaj() {
		if (typeof sessionStorage === 'undefined') return;
		const surowe = sessionStorage.getItem(KLUCZ);
		if (!surowe) return;
		try {
			const z = { ...pusty(), ...(JSON.parse(surowe) as Zrzut) };
			this.krok = z.krok;
			this.branza = z.branza;
			this.wariant = z.wariant;
			this.medi = z.medi;
			this.gd = z.gd;
			this.pakiety = z.pakiety;
			this.adopcja = z.adopcja;
			this.tryb = z.tryb;
			this.liczbaOsob = z.liczbaOsob;
			this.struktura = z.struktura;
			this.gus = z.gus;
			this.kontakt = z.kontakt;
			this.zgody = z.zgody;
		} catch {
			sessionStorage.removeItem(KLUCZ);
		}
	}

	wyczysc() {
		if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(KLUCZ);
		Object.assign(this, pusty());
		this.statystyki = null;
		this.pokaz3 = false;
		this.wysylka = { stan: 'brak' };
	}
}

export const stan = new StanWniosku();
