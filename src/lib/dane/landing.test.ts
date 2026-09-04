import { describe, it, expect } from 'vitest';
import produkty from '$lib/dane/produkty.json';
import tresci from '$lib/dane/branze-landing.json';
import type { Produkty } from '$lib/domena/typy';

const db = produkty as unknown as Produkty;
const landing = tresci as unknown as Record<
	string,
	{
		naglowek: string;
		lead: string;
		kogo: string[];
		scenariusze: { kod: string; tytul: string; opis: string }[];
		seo_tytul: string;
		seo_opis: string;
	}
>;

const slugi = Object.keys(landing).filter((k) => k !== '_meta');

describe('treści landingów branżowych', () => {
	it('każda branża z cennika ma treść landingu i odwrotnie', () => {
		expect([...slugi].sort()).toEqual(db.branze.map((b) => b.slug).sort());
	});

	it.each(slugi)('%s: każdy scenariusz ma kwotę w tabeli tej branży', (slug) => {
		const branza = db.branze.find((b) => b.slug === slug)!;
		for (const s of landing[slug].scenariusze) {
			// Kod musi istnieć w słowniku świadczeń…
			expect(db.swiadczenia[s.kod], `nieznany kod świadczenia: ${s.kod}`).toBeDefined();
			// …i mieć wartość w Wariancie I, bo landing pokazuje właśnie ją.
			expect(branza.s[s.kod]?.[0], `${slug}: brak kwoty dla ${s.kod} w W1`).not.toBeNull();
		}
	});

	it.each(slugi)('%s: ma komplet pól i szablon {od} w tytule SEO', (slug) => {
		const t = landing[slug];
		expect(t.naglowek.length).toBeGreaterThan(10);
		expect(t.lead.length).toBeGreaterThan(40);
		expect(t.kogo.length).toBeGreaterThanOrEqual(3);
		expect(t.scenariusze.length).toBe(3);
		expect(t.seo_tytul).toContain('{od}');
		expect(t.seo_opis.length).toBeGreaterThan(60);
	});

	it('stomatologia ostrzega o niemonotoniczności wariantów', () => {
		const s = db.branze.find((b) => b.slug === 'stomatologia')!;
		expect(s.s.zgon[2]!).toBeGreaterThan(s.s.zgon[0]!);
	});
});
