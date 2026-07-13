/**
 * Minimalny klient API REGON (BIR1.1, usługa SOAP GUS).
 * Przepływ: Zaloguj → DaneSzukajPodmioty(NIP) → DanePobierzPelnyRaport(PKD).
 */

const URL_BIR = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const NS = 'http://CIS/BIR/PUBL/2014/07';

export interface FirmaZGus {
	nazwa: string;
	regon: string;
	adres?: string;
	pkd_kod?: string;
	pkd_opis?: string;
	forma?: string;
}

export class GusBrakFirmy extends Error {}
export class GusAwaria extends Error {}

function koperta(akcja: string, cialo: string): string {
	return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">
<soap:Header><wsa:To>${URL_BIR}</wsa:To><wsa:Action>${NS}/IUslugaBIRzewnPubl/${akcja}</wsa:Action></soap:Header>
<soap:Body>${cialo}</soap:Body>
</soap:Envelope>`;
}

async function soap(akcja: string, cialo: string, sid?: string): Promise<string> {
	const odp = await fetch(URL_BIR, {
		method: 'POST',
		headers: {
			'content-type': 'application/soap+xml;charset=UTF-8',
			...(sid ? { sid } : {})
		},
		body: koperta(akcja, cialo),
		signal: AbortSignal.timeout(5000)
	});
	if (!odp.ok) throw new GusAwaria(`BIR HTTP ${odp.status}`);
	const tekst = await odp.text();
	// odpowiedź jest multipart (MTOM) — wycinamy samą kopertę SOAP
	const od = tekst.indexOf('<s:Envelope');
	const do_ = tekst.lastIndexOf('</s:Envelope>');
	if (od < 0 || do_ < 0) throw new GusAwaria('BIR: brak koperty w odpowiedzi');
	return tekst.slice(od, do_ + '</s:Envelope>'.length);
}

function wytnij(xml: string, tag: string): string | null {
	const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
	return m ? m[1] : null;
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
	// 1. logowanie → identyfikator sesji
	const logXml = await soap(
		'Zaloguj',
		`<ns:Zaloguj xmlns:ns="${NS}"><ns:pKluczUzytkownika>${klucz}</ns:pKluczUzytkownika></ns:Zaloguj>`
	);
	const sid = wytnij(logXml, 'ZalogujResult');
	if (!sid) throw new GusAwaria('BIR: logowanie nie zwróciło sesji');

	// 2. wyszukanie po NIP
	const szukajXml = await soap(
		'DaneSzukajPodmioty',
		`<ns:DaneSzukajPodmioty xmlns:ns="${NS}"><ns:pParametryWyszukiwania><dat:Nip xmlns:dat="${NS}/DataContract">${nip}</dat:Nip></ns:pParametryWyszukiwania></ns:DaneSzukajPodmioty>`,
		sid
	);
	const wynikSurowy = wytnij(szukajXml, 'DaneSzukajPodmiotyResult');
	if (!wynikSurowy || !wynikSurowy.trim()) throw new GusBrakFirmy(nip);
	const wynik = odkoduj(wynikSurowy);
	if (wynik.includes('<ErrorCode>')) {
		const kod = wytnij(wynik, 'ErrorCode');
		if (kod === '4') throw new GusBrakFirmy(nip);
		throw new GusAwaria(`BIR ErrorCode ${kod}`);
	}

	const pole = (t: string) => wytnij(wynik, t)?.trim() || undefined;
	const regon = pole('Regon');
	const nazwa = pole('Nazwa');
	if (!regon || !nazwa) throw new GusBrakFirmy(nip);
	const typ = pole('Typ'); // P = prawna, F = fizyczna, LP/LF = jednostki lokalne

	const czesciAdresu = [
		[pole('Ulica'), pole('NrNieruchomosci')].filter(Boolean).join(' '),
		[pole('KodPocztowy'), pole('Miejscowosc')].filter(Boolean).join(' ')
	].filter(Boolean);

	const firma: FirmaZGus = {
		nazwa,
		regon,
		adres: czesciAdresu.join(', ') || undefined
	};

	// 3. PKD przeważające z pełnego raportu (najlepszy wysiłek — błąd nie blokuje)
	try {
		const raport = typ === 'F' ? 'BIR11OsFizycznaPkd' : 'BIR11OsPrawnaPkd';
		const pkdXml = await soap(
			'DanePobierzPelnyRaport',
			`<ns:DanePobierzPelnyRaport xmlns:ns="${NS}"><ns:pRegon>${regon}</ns:pRegon><ns:pNazwaRaportu>${raport}</ns:pNazwaRaportu></ns:DanePobierzPelnyRaport>`,
			sid
		);
		const dane = odkoduj(wytnij(pkdXml, 'DanePobierzPelnyRaportResult') ?? '');
		// wiersze: (praw|fiz)_pkd_?Kod / _Nazwa / _Przewazajace
		const wiersze = dane.match(/<dane>[\s\S]*?<\/dane>/g) ?? [];
		const przewazajacy =
			wiersze.find((w) => /_pkd_?[Pp]rzewazajace>\s*1/.test(w)) ?? wiersze[0];
		if (przewazajacy) {
			firma.pkd_kod = przewazajacy.match(/_pkd_?[Kk]od>([^<]+)</)?.[1]?.trim();
			firma.pkd_opis = przewazajacy.match(/_pkd_?[Nn]azwa>([^<]+)</)?.[1]?.trim();
		}
	} catch {
		// PKD jest informacyjne — brak nie blokuje kreatora
	}

	return firma;
}
