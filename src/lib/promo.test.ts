import { describe, it, expect } from 'vitest';
import { PROMO, nazwaPromo, linkPromo } from '$lib/promo';

describe('banery promocyjne', () => {
	it('nazwa pliku bez prefiksu, numeru i rozszerzenia', () => {
		expect(nazwaPromo('./promo/utrata-dochodu-03-programista.png')).toBe('programista');
		expect(nazwaPromo('./promo/baner-zima.webp')).toBe('baner-zima');
	});

	it('utm_content niesie nazwę grafiki, pozostałe UTM-y bez zmian', () => {
		expect(linkPromo('programista')).toBe(
			'https://utratadochodu.pl/?utm_source=partner&utm_medium=display&utm_campaign=permanentlink&utm_content=ergobranzowe-programista&utm_term=wniosek'
		);
	});

	it('każdy baner ma własne utm_content', () => {
		expect(PROMO.length).toBeGreaterThan(0);
		const tresci = PROMO.map((p) => new URL(p.href).searchParams.get('utm_content'));
		expect(new Set(tresci).size).toBe(PROMO.length);
	});
});
