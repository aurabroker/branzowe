import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { PROMO } from '$lib/promo';

describe('banery promocyjne', () => {
	it('lista w promo.ts zgadza się z plikami w static/banery/', () => {
		const pliki = readdirSync('static/banery').map((p) => `/banery/${p}`);
		expect([...PROMO].sort()).toEqual(pliki.sort());
	});
});
