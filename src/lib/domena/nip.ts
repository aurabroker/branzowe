/** Walidacja NIP (suma kontrolna). */
export function czystyNip(v: string): string {
	return (v || '').replace(/\D/g, '');
}

export function nipPoprawny(v: string): boolean {
	const d = czystyNip(v);
	if (d.length !== 10) return false;
	const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
	const s = w.reduce((a, x, i) => a + x * +d[i], 0) % 11;
	return s !== 10 && s === +d[9];
}
