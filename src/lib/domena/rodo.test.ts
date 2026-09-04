import { describe, it, expect } from 'vitest';
import { zawieraPesel } from './rodo';

/** Minimalny payload w kształcie tego, co wysyła kreator. */
const bazowy = () => ({
	branza: 'stomatologia',
	liczba_osob: 4,
	struktura: [{ rok: 1988, plec: 'K', liczba: 4 }],
	firma: { nip: '5252248481', nazwa: 'Gabinet sp. z o.o.' },
	kontakt: { imie: 'Anna Nowak', email: 'anna@example.com', telefon: '+48123456789' },
	zrodlo_wizyty: null as unknown
});

describe('zawieraPesel — siatka bezpieczeństwa RODO', () => {
	it('przepuszcza poprawny payload z agregatem', () => {
		expect(zawieraPesel(bazowy())).toBe(false);
	});

	it('odrzuca PESEL schowany w strukturze', () => {
		const p = bazowy() as Record<string, unknown>;
		p.struktura = [{ rok: 1988, plec: 'K', liczba: 4, pesel: '88010112345' }];
		expect(zawieraPesel(p)).toBe(true);
	});

	it('odrzuca PESEL w dowolnym innym polu', () => {
		const p = bazowy() as Record<string, unknown>;
		(p.kontakt as Record<string, string>).stanowisko = 'właściciel 88010112345';
		expect(zawieraPesel(p)).toBe(true);
	});

	it('nie myli telefonu z prefiksem kraju z PESEL-em', () => {
		const p = bazowy();
		p.kontakt.telefon = '+48123456789';
		expect(zawieraPesel(p)).toBe(false);
	});

	it('nie odrzuca wniosku przez długi identyfikator kliknięcia reklamy', () => {
		const p = bazowy();
		// gclid potrafi zawierać jedenaście cyfr pod rząd — bez wyłączenia tego
		// pola poprawny wniosek z reklamy byłby odrzucany
		p.zrodlo_wizyty = {
			utm_source: 'google',
			gclid: 'EAIaIQobChMI12345678901xyz',
			wejscie: '/branza/stomatologia'
		};
		expect(zawieraPesel(p)).toBe(false);
	});

	it('działa na payloadzie bez kontaktu i bez źródła', () => {
		expect(zawieraPesel({ cokolwiek: 'abc' })).toBe(false);
		expect(zawieraPesel({ cokolwiek: '12345678901' })).toBe(true);
	});
});
