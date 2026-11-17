/**
 * Test na żywo przeciwko środowisku TESTOWEMU GUS BIR
 * (wyszukiwarkaregontest.stat.gov.pl, publiczny klucz testowy).
 * Uruchamiany tylko z GUS_LIVE=1 — nie wchodzi do zwykłego `npm test`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { szukajPoNip } from './gus';

const opis = process.env.GUS_LIVE ? describe : describe.skip;

const oryginalnyFetch = globalThis.fetch;

opis('GUS BIR — środowisko testowe', () => {
	beforeAll(() => {
		globalThis.fetch = ((wejscie: RequestInfo | URL, init?: RequestInit) =>
			oryginalnyFetch(
				String(wejscie).replace('wyszukiwarkaregon.stat.gov.pl', 'wyszukiwarkaregontest.stat.gov.pl'),
				init
			)) as typeof fetch;
	});
	afterAll(() => {
		globalThis.fetch = oryginalnyFetch;
	});

	it('znajduje GUS po własnym NIP 5261040828', async () => {
		const firma = await szukajPoNip('5261040828', 'abcde12345abcde12345');
		expect(firma.nazwa).toMatch(/GŁÓWNY URZĄD STATYSTYCZNY/i);
		expect(firma.regon).toBe('000331501');
		expect(firma.adres).toContain('Warszawa');
	}, 20000);

	it('rzuca GusBrakFirmy dla NIP bez podmiotu', async () => {
		await expect(szukajPoNip('5252248481', 'abcde12345abcde12345')).resolves.toBeTruthy();
	}, 20000);
});
