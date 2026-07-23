/**
 * Katalog zgód i oświadczeń kreatora. `wersja` idzie do bazy razem ze zgodą —
 * zmiana treści wymaga podbicia wersji.
 * TODO: treści robocze z prototypu — do zatwierdzenia przez prawnika.
 */
export interface Zgoda {
	kod: string;
	wymagana: boolean;
	wersja: string;
	etykieta: string;
	tresc: string;
}

export const ZGODY: Zgoda[] = [
	{
		kod: 'z1',
		wymagana: true,
		wersja: '2026-07-a',
		etykieta: 'Zgoda na objęcie grupowym ubezpieczeniem na życie ERGO Życie w Biznesie',
		tresc:
			'Wnioskuję o zawarcie umowy grupowego ubezpieczenia na życie ERGO Życie w Biznesie na warunkach określonych w OWU (kod: EZwB 01/25) oraz OWU ubezpieczeń dodatkowych, które wybrałem w tym wniosku.'
	},
	{
		kod: 'z2',
		wymagana: true,
		wersja: '2026-07-a',
		etykieta: 'Oświadczenie o zapoznaniu się z OWU i kartami produktu',
		tresc:
			'Oświadczam, że przed złożeniem wniosku otrzymałem i zapoznałem się z Ogólnymi warunkami ubezpieczenia (EZwB 01/25), OWU MediOpieka (MA 01/25) oraz OWU Global Doctors (GD-GZ 01/25), w tym z wyłączeniami i ograniczeniami odpowiedzialności.'
	},
	{
		kod: 'z3',
		wymagana: true,
		wersja: '2026-07-a',
		etykieta: 'Zgoda na przetwarzanie danych osobowych (RODO)',
		tresc:
			'Administratorem danych jest Sopockie Towarzystwo Ubezpieczeń na Życie ERGO Hestia S.A. Dane przetwarzamy w celu zawarcia i wykonania umowy ubezpieczenia (art. 6 ust. 1 lit. b RODO) oraz w celach wynikających z prawnie uzasadnionych interesów administratora.'
	},
	{
		kod: 'z4',
		wymagana: true,
		wersja: '2026-07-a',
		etykieta: 'Oświadczenie o liczbie i wieku osób zgłaszanych do ubezpieczenia',
		tresc:
			'Oświadczam, że osoby zgłaszane do ubezpieczenia są aktywne zawodowo, mają od 15 do 70 lat, a ich liczba mieści się w przedziale 2–100.'
	},
	{
		kod: 'z5',
		wymagana: true,
		wersja: '2026-07-a',
		etykieta: 'Oświadczenie o statusie nowego klienta',
		tresc:
			'Oświadczam, że firma nie posiada obecnie umowy grupowego ubezpieczenia na życie w ERGO Hestii — oferta branżowa dotyczy nowych klientów.'
	},
	{
		kod: 'z6',
		wymagana: false,
		wersja: '2026-07-a',
		etykieta: 'Zgoda marketingowa — e-mail',
		tresc:
			'Zgoda na otrzymywanie informacji handlowych drogą elektroniczną. Dobrowolna, można wycofać w każdej chwili.'
	},
	{
		kod: 'z7',
		wymagana: false,
		wersja: '2026-07-a',
		etykieta: 'Zgoda marketingowa — telefon',
		tresc:
			'Zgoda na kontakt telefoniczny w celach marketingowych. Dobrowolna, można wycofać w każdej chwili.'
	}
];

export const KODY_WYMAGANE = ZGODY.filter((z) => z.wymagana).map((z) => z.kod);
