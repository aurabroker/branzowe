import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import produkty from '$lib/dane/produkty.json';
import type { Produkty, WariantIdx } from '$lib/domena/typy';
import { wyliczSkladke } from '$lib/domena/skladka';
import { nipPoprawny } from '$lib/domena/nip';
import { KODY_WYMAGANE } from '$lib/domena/zgody';
import { supabaseAdmin } from '$lib/serwer/supabase';
import { wyslijMaile } from '$lib/serwer/resend';

const db = produkty as unknown as Produkty;
const CENNIK_WERSJA = 'branze-2607';

const RokNajstarszy = 1940;
const RokNajmlodszy = new Date().getFullYear() - 10;

const schemat = z.object({
	branza: z.string().refine((s) => db.branze.some((b) => b.slug === s), 'nieznana branża'),
	wariant: z.number().int().min(0).max(2),
	rozszerzenia: z.object({
		medi: z.array(z.string().refine((s) => db.mediopieka.some((m) => m.slug === s))).max(10),
		gd: z.boolean(),
		pakiety: z.record(
			z.string().refine((s) => db.pakiety_dodatkowe.some((p) => p.slug === s)),
			z.number().int().min(0).max(2)
		)
	}),
	zalozona_adopcja: z.number().min(0).max(1),
	liczba_osob: z.number().int().min(2).max(100),
	// agregat rocznik × płeć — jedyny dopuszczalny kształt danych o zespole
	struktura: z
		.array(
			z.object({
				rok: z.number().int().min(RokNajstarszy).max(RokNajmlodszy),
				plec: z.enum(['K', 'M']),
				liczba: z.number().int().min(1).max(100)
			})
		)
		.max(200)
		.nullable(),
	firma: z.object({
		nip: z.string().refine(nipPoprawny, 'błędny NIP'),
		nazwa: z.string().min(3).max(300),
		regon: z.string().max(20).optional(),
		adres: z.string().max(300).optional(),
		pkd_kod: z.string().max(10).optional(),
		pkd_opis: z.string().max(300).optional(),
		zrodlo: z.enum(['gus', 'recznie'])
	}),
	kontakt: z.object({
		imie: z.string().min(3).max(120),
		stanowisko: z.string().max(120).optional().default(''),
		email: z.string().email().max(200),
		telefon: z.string().min(9).max(20),
		start: z.string().max(10).optional().default('')
	}),
	zgody: z.record(z.string(), z.object({ wersja: z.string().max(20) })),
	skladka_klienta: z.object({ min: z.number(), max: z.number(), szacunek: z.number() })
});

/**
 * Walidacja negatywna RODO: w payloadzie (poza numerem telefonu) nie może być
 * żadnego ciągu 11 cyfr — PESEL-e mają zostać w przeglądarce.
 */
function zawieraPesel(dane: z.infer<typeof schemat>): boolean {
	const kopia = structuredClone(dane);
	kopia.kontakt.telefon = ''; // telefon z prefiksem kraju to legalnie 11 cyfr
	return /\d{11}/.test(JSON.stringify(kopia));
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env?.SUPABASE_URL) error(503, 'Backend nieskonfigurowany');

	let cialo: unknown;
	try {
		cialo = await request.json();
	} catch {
		error(400, 'Nieprawidłowy JSON');
	}
	const wynik = schemat.safeParse(cialo);
	if (!wynik.success) error(422, `Walidacja: ${wynik.error.issues[0]?.message ?? 'błąd danych'}`);
	const dane = wynik.data;

	if (zawieraPesel(dane)) error(422, 'Payload zawiera ciąg wyglądający jak PESEL — odrzucono');

	if (dane.struktura) {
		const suma = dane.struktura.reduce((a, p) => a + p.liczba, 0);
		if (suma !== dane.liczba_osob) error(422, 'Suma struktury nie zgadza się z liczbą osób');
	}

	for (const kod of KODY_WYMAGANE) {
		if (!dane.zgody[kod]) error(422, `Brak wymaganej zgody ${kod}`);
	}

	// składce klienta nie ufamy — przeliczamy z cennika po stronie serwera
	const w = wyliczSkladke(
		db,
		dane.branza,
		dane.wariant as WariantIdx,
		{
			medi: dane.rozszerzenia.medi,
			gd: dane.rozszerzenia.gd,
			pakiety: dane.rozszerzenia.pakiety as Record<string, WariantIdx>
		},
		dane.liczba_osob,
		dane.zalozona_adopcja
	);
	const rozjazd =
		Math.abs(w.min - dane.skladka_klienta.min) > 0.01 ||
		Math.abs(w.max - dane.skladka_klienta.max) > 0.01;
	if (rozjazd) {
		return json(
			{ blad: 'Cennik się zmienił — odśwież stronę', skladka: { min: w.min, max: w.max } },
			{ status: 409 }
		);
	}

	const supabase = supabaseAdmin(env);
	const { data: wpis, error: bladBazy } = await supabase
		.from('wnioski')
		.insert({
			cennik_wersja: CENNIK_WERSJA,
			branza: dane.branza,
			wariant: dane.wariant + 1,
			rozszerzenia: dane.rozszerzenia,
			zalozona_adopcja: dane.zalozona_adopcja,
			liczba_osob: dane.liczba_osob,
			struktura: dane.struktura,
			firma: dane.firma,
			kontakt: dane.kontakt,
			zgody: Object.fromEntries(
				Object.entries(dane.zgody).map(([k, v]) => [
					k,
					{ ...v, ts: new Date().toISOString() }
				])
			),
			skladka: { os: w.baza, min: w.min, max: w.max, szacunek: w.szacunek }
		})
		.select('id, nr_wniosku')
		.single();

	if (bladBazy || !wpis) {
		console.error('wnioski insert:', bladBazy);
		error(500, 'Nie udało się zapisać wniosku');
	}

	// maile: błąd nie wycofuje wniosku — logujemy do zdarzenia i jedziemy dalej
	const bledyMaili = await wyslijMaile(env, {
		nrWniosku: wpis.nr_wniosku,
		branzaNazwa: db.branze.find((b) => b.slug === dane.branza)!.nazwa,
		wariant: dane.wariant,
		liczbaOsob: dane.liczba_osob,
		kompletny: !!dane.struktura,
		firmaNazwa: dane.firma.nazwa,
		nip: dane.firma.nip,
		email: dane.kontakt.email,
		imie: dane.kontakt.imie,
		telefon: dane.kontakt.telefon,
		wyliczenie: w,
		adopcja: dane.zalozona_adopcja
	}).catch((e) => [{ adresat: '-', blad: String(e) }]);

	const zdarzenia = [
		{ typ: 'wyslano', dane: { wniosek: wpis.id, branza: dane.branza } },
		...bledyMaili.map((b) => ({ typ: 'mail_blad', dane: { wniosek: wpis.id, ...b } }))
	];
	await supabase.from('zdarzenia').insert(zdarzenia.map((z) => ({ ...z, sesja: wpis.id })));

	return json({ nr_wniosku: wpis.nr_wniosku }, { status: 201 });
};
