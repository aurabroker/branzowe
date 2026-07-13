/**
 * Klient API REGON (GUS BIR 1.1, SOAP 1.2 + WS-Addressing).
 * Przepływ wg dokumentacji referencyjnej (docs/REGONAPILOGIN.md):
 * Zaloguj → sid w nagłówku HTTP → DaneSzukajPodmioty(NIP) → PKD z pełnego raportu.
 */

const URL_BIR = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const NS = 'http://CIS/BIR/PUBL/2014/07';

export interface FirmaZGus {
	nazwa: string;
	regon: string;
	adres?: string;
	pkd_kod?: string;
	pkd_opis?: string;
	/** data zawieszenia działalności — jeśli ustawiona, firma jest zawieszona */
	data_zawieszenia?: string;
}

export class GusBrakFirmy extends Error {}
export class GusAwaria extends Error {}

function koperta(akcja: string, cialo: string): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}" xmlns:dat="${NS}/DataContract">
<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing"><wsa:To>${URL_BIR}</wsa:To><wsa:Action>${NS}/IUslugaBIRzewnPubl/${akcja}</wsa:Action></soap:Header>
<soap:Body>${cialo}</soap:Body>
</soap:Envelope>`;
}

async function soap(akcja: string, cialo: string, sid?: string): Promise<string> {
	const odp = await fetch(URL_BIR, {
		method: 'POST',
		headers: {
			'content-type': 'application/soap+xml; charset=utf-8',
			...(sid ? { sid } : {})
		},
		body: koperta(akcja, cialo),
		signal: AbortSignal.timeout(5000)
	});
	if (!odp.ok) throw new GusAwaria(`BIR HTTP ${odp.status}`);
	// odpowiedź bywa multipart (MTOM) — regexy działają na pełnym tekście
	return odp.text();
}

function wytnij(xml: string, tag: string): string | null {
	const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
	return m ? m[1].trim() : null;
}

function odkoduj(s: string): string {
	return s
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#xD;', '')
		.replaceAll('&amp;', '&');
}

export async function szukajPoNip(nip: string, klucz: string): Promise<FirmaZGus> {
	// 1. logowanie → identyfikator sesji; pusty ZalogujResult = odrzucony klucz
	const logXml = await soap(
		'Zaloguj',
		`<ns:Zaloguj><ns:pKluczUzytkownika>${klucz}</ns:pKluczUzytkownika></ns:Zaloguj>`
	);
	const sid = wytnij(logXml, 'ZalogujResult');
	if (!sid) throw new GusAwaria('BIR: logowanie odrzucone (pusty ZalogujResult — sprawdź klucz)');

	// 2. wyszukanie po NIP — sid w nagłówku HTTP
	const szukajXml = await soap(
		'DaneSzukajPodmioty',
		`<ns:DaneSzukajPodmioty><ns:pParametryWyszukiwania><dat:Nip>${nip}</dat:Nip></ns:pParametryWyszukiwania></ns:DaneSzukajPodmioty>`,
		sid
	);
	const wynikSurowy = wytnij(szukajXml, 'DaneSzukajPodmiotyResult');
	if (!wynikSurowy) throw new GusBrakFirmy(nip);
	const wynik = odkoduj(wynikSurowy);
	if (wynik.includes('<ErrorCode>')) {
		const kod = wytnij(wynik, 'ErrorCode');
		if (kod === '4') throw new GusBrakFirmy(nip);
		throw new GusAwaria(`BIR ErrorCode ${kod}`);
	}

	const pole = (t: string) => wytnij(wynik, t) || undefined;
	const nazwa = pole('Nazwa');
	const regon = pole('Regon');
	// brak Nazwa = nie znaleziono (wg dokumentacji BIR)
	if (!nazwa || !regon) throw new GusBrakFirmy(nip);
	const typ = pole('Typ'); // P = prawna, F = fizyczna, LP/LF = jednostki lokalne

	const ulica = [pole('Ulica'), pole('NrNieruchomosci')].filter(Boolean).join(' ');
	const lokal = pole('NrLokalu');
	const czesciAdresu = [
		lokal && ulica ? `${ulica}/${lokal}` : ulica,
		[pole('KodPocztowy'), pole('Miejscowosc')].filter(Boolean).join(' ')
	].filter(Boolean);

	const firma: FirmaZGus = {
		nazwa,
		regon,
		adres: czesciAdresu.join(', ') || undefined,
		data_zawieszenia: pole('DataZawieszeniaDzialalnosci')
	};

	// 3. PKD przeważające z pełnego raportu (najlepszy wysiłek — błąd nie blokuje)
	try {
		const raport = typ === 'F' ? 'BIR11OsFizycznaPkd' : 'BIR11OsPrawnaPkd';
		const pkdXml = await soap(
			'DanePobierzPelnyRaport',
			`<ns:DanePobierzPelnyRaport><ns:pRegon>${regon}</ns:pRegon><ns:pNazwaRaportu>${raport}</ns:pNazwaRaportu></ns:DanePobierzPelnyRaport>`,
			sid
		);
		const dane = odkoduj(wytnij(pkdXml, 'DanePobierzPelnyRaportResult') ?? '');
		// wiersze: (praw|fiz)_pkd_?Kod / _Nazwa / _Przewazajace
		const wiersze = dane.match(/<dane>[\s\S]*?<\/dane>/g) ?? [];
		const przewazajacy = wiersze.find((w) => /_pkd_?[Pp]rzewazajace>\s*1/.test(w)) ?? wiersze[0];
		if (przewazajacy) {
			firma.pkd_kod = przewazajacy.match(/_pkd_?[Kk]od>([^<]+)</)?.[1]?.trim();
			firma.pkd_opis = przewazajacy.match(/_pkd_?[Nn]azwa>([^<]+)</)?.[1]?.trim();
		}
	} catch {
		// PKD jest informacyjne — brak nie blokuje kreatora
	}

	return firma;
}
