/**
 * Wgrywa dane/produkty.json jako wiersz cennika 'branze-2607' do Supabase.
 * Wymaga env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Uruchomienie: node scripts/seed-cennika.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const korzen = join(dirname(fileURLToPath(import.meta.url)), '..');
const dane = JSON.parse(readFileSync(join(korzen, 'dane', 'produkty.json'), 'utf8'));

const url = process.env.SUPABASE_URL;
const klucz = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !klucz) {
	console.error('Ustaw SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

const wiersz = {
	wersja: 'branze-2607',
	obowiazuje_od: dane.meta.skladki_obowiazuja.branze_od,
	obowiazuje_do: dane.meta.skladki_obowiazuja.branze_do,
	dane
};

const odp = await fetch(`${url}/rest/v1/ezb_cenniki?on_conflict=wersja`, {
	method: 'POST',
	headers: {
		apikey: klucz,
		authorization: `Bearer ${klucz}`,
		'content-type': 'application/json',
		prefer: 'resolution=merge-duplicates,return=representation'
	},
	body: JSON.stringify(wiersz)
});
if (!odp.ok) {
	console.error('Błąd:', odp.status, await odp.text());
	process.exit(1);
}
const [zapisany] = await odp.json();
console.log(`Cennik '${zapisany.wersja}' (id ${zapisany.id}) wgrany, obowiązuje ${zapisany.obowiazuje_od} – ${zapisany.obowiazuje_do}.`);
