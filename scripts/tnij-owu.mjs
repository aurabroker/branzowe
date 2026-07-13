/**
 * Tnie dane/owu.json i dane/mo.json na porcje JSON serwowane statycznie
 * z static/dane/owu/ — żeby 900 KB danych OWU nie trafiało do bundla.
 *
 * Wynik:
 *   static/dane/owu/rozdzialy-ezb.json     — rozdziały EZwB (zdarzenia/karencje/wyłączenia)
 *   static/dane/owu/rozdzialy-mo.json      — rozdziały MediOpieki
 *   static/dane/owu/powazne-zachorowania.json
 *   static/dane/owu/operacje-<n>.json      — katalog 602 operacji, strony po 150
 *   static/dane/owu/operacje-indeks.json   — metadane stronicowania + stawki podgrup
 *   static/dane/owu/slowniczek.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const korzen = join(dirname(fileURLToPath(import.meta.url)), '..');
const wyjscie = join(korzen, 'static', 'dane', 'owu');
mkdirSync(wyjscie, { recursive: true });

const owu = JSON.parse(readFileSync(join(korzen, 'dane', 'owu.json'), 'utf8'));
const mo = JSON.parse(readFileSync(join(korzen, 'dane', 'mo.json'), 'utf8'));

const zapisz = (nazwa, dane) => {
	const sciezka = join(wyjscie, nazwa);
	writeFileSync(sciezka, JSON.stringify(dane));
	console.log(`  ${nazwa} — ${(Buffer.byteLength(JSON.stringify(dane)) / 1024).toFixed(0)} KB`);
};

console.log('Tnę OWU do static/dane/owu/:');

// pdfplumber wplata w treść stopkę strony „Spis treści StronaNNN"
// (na końcu punktu i w miejscach łamania stron) — czyścimy globalnie
const czysc = (t) => t.replace(/\s*Spis treści Strona\s*\d+\s*/g, ' ').trim();
const czyscPunkty = (lista) => (lista ?? []).map((x) => ({ ...x, tresc: czysc(x.tresc) }));

// Rozdziały: tylko pola potrzebne w zakładce „Ograniczenia"
const odchudzRozdzial = (r) => ({
	nr: r.nr,
	nazwa: r.nazwa,
	strona: r.strona,
	kod: r.kod_swiadczenia ?? null,
	karencja: czyscPunkty(r.karencja),
	wylaczenia: czyscPunkty(r.wylaczenia),
	dokumenty: czyscPunkty(r.dokumenty)
});
zapisz(
	'rozdzialy-ezb.json',
	owu.rozdzialy
		.map(odchudzRozdzial)
		.filter((r) => r.karencja.length || r.wylaczenia.length || r.dokumenty.length)
);
zapisz(
	'rozdzialy-mo.json',
	mo.rozdzialy
		.map(odchudzRozdzial)
		.filter((r) => r.karencja.length || r.wylaczenia.length || r.dokumenty.length)
);

zapisz('powazne-zachorowania.json', owu.powazne_zachorowania);

const op = owu.katalog_operacji;
const NA_STRONE = 150;
const stron = Math.ceil(op.pozycje.length / NA_STRONE);
for (let i = 0; i < stron; i++) {
	zapisz(`operacje-${i + 1}.json`, op.pozycje.slice(i * NA_STRONE, (i + 1) * NA_STRONE));
}
zapisz('operacje-indeks.json', {
	zrodlo: op._zrodlo,
	liczba: op._liczba_pozycji,
	stawki: op._stawki,
	stron,
	na_strone: NA_STRONE
});

zapisz('slowniczek.json', mo.slowniczek);

// Najczęstsze wyłączenia: źródło ma tylko prefiksy treści — pełne brzmienia
// odzyskujemy z rozdziałów, grupując identyczne teksty z listą rozdziałów.
const wspolne = owu.wylaczenia_wspolne_top.map((w) => {
	const brzmienia = new Map(); // pełna treść → [{nr, nazwa}]
	for (const r of owu.rozdzialy) {
		for (const x of r.wylaczenia ?? []) {
			if (!x.tresc.startsWith(w.tresc_prefix)) continue;
			const tresc = czysc(x.tresc);
			if (!brzmienia.has(tresc)) brzmienia.set(tresc, []);
			brzmienia.get(tresc).push({ nr: r.nr, nazwa: r.nazwa });
		}
	}
	return {
		tresc_prefix: w.tresc_prefix,
		liczba_wystapien: w.liczba_wystapien,
		brzmienia: [...brzmienia.entries()]
			.sort((a, b) => b[1].length - a[1].length)
			.map(([tresc, rozdzialy]) => ({ tresc, rozdzialy }))
	};
});
const bezPelnych = wspolne.filter((w) => !w.brzmienia.length);
if (bezPelnych.length)
	console.warn(`  UWAGA: ${bezPelnych.length} prefiksów bez pełnej treści w rozdziałach`);

// Metadane do zakładki „Ograniczenia": najczęstsze wyłączenia + statystyki
zapisz('owu-meta.json', {
	wylaczenia_wspolne_top: wspolne,
	statystyki: owu.statystyki,
	mediopieka_statystyki: mo.statystyki
});

console.log('Gotowe.');
