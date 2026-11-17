import { describe, it, expect } from 'vitest';
import { zbudujZrodlo, oczysc, hostOdsylajacego, MAX_DLUGOSC } from './zrodlo';

const url = (s: string) => new URL(s);

describe('zrodlo — atrybucja kampanii', () => {
	it('przepisuje parametry UTM i ścieżkę wejścia', () => {
		const z = zbudujZrodlo(
			url('https://ergo.auraexpert.pl/branza/stomatologia?utm_source=google&utm_medium=cpc&utm_campaign=stomatologia-2609'),
			''
		);
		expect(z).toMatchObject({
			utm_source: 'google',
			utm_medium: 'cpc',
			utm_campaign: 'stomatologia-2609',
			wejscie: '/branza/stomatologia'
		});
	});

	it('zapisuje identyfikator kliknięcia bez parametrów UTM', () => {
		const z = zbudujZrodlo(url('https://ergo.auraexpert.pl/branza/beauty?gclid=Cj0KCQjw1234567890'), '');
		expect(z?.gclid).toBe('Cj0KCQjw1234567890');
		expect(z?.wejscie).toBe('/branza/beauty');
	});

	it('wejście bezpośrednie bez kampanii nie tworzy rekordu', () => {
		expect(zbudujZrodlo(url('https://ergo.auraexpert.pl/'), '')).toBeNull();
	});

	it('zapisuje domenę odsyłającą, ale nie własną', () => {
		const obcy = zbudujZrodlo(url('https://ergo.auraexpert.pl/'), 'https://www.google.com/search?q=x');
		expect(obcy?.skad).toBe('www.google.com');

		const wlasny = zbudujZrodlo(
			url('https://ergo.auraexpert.pl/wniosek'),
			'https://ergo.auraexpert.pl/branza/beauty'
		);
		expect(wlasny).toBeNull();
	});

	it('nie wywraca się na zepsutym referrerze', () => {
		expect(hostOdsylajacego('to-nie-jest-url', 'ergo.auraexpert.pl')).toBe('');
		expect(hostOdsylajacego('', 'ergo.auraexpert.pl')).toBe('');
	});

	it('przycina zbyt długie wartości i usuwa znaki sterujące', () => {
		expect(oczysc('a'.repeat(500))).toHaveLength(MAX_DLUGOSC);
		expect(oczysc('kam\u0000pa\u001fnia')).toBe('kampania');
	});

	it('nie zbiera parametrów spoza białej listy', () => {
		const z = zbudujZrodlo(
			url('https://ergo.auraexpert.pl/?utm_source=fb&email=jan@example.com&pesel=12345678901'),
			''
		);
		expect(z).not.toHaveProperty('email');
		expect(z).not.toHaveProperty('pesel');
		expect(JSON.stringify(z)).not.toContain('12345678901');
	});
});
