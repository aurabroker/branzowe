import { error } from '@sveltejs/kit';
import type { PageLoad, EntryGenerator } from './$types';
import { ZAKLADKI } from '$lib/komponenty/zakres/zakladki';

export const prerender = true;

export const entries: EntryGenerator = () => ZAKLADKI.map((z) => ({ zakladka: z.slug }));

export const load: PageLoad = ({ params }) => {
	const zakladka = ZAKLADKI.find((z) => z.slug === params.zakladka);
	if (!zakladka) error(404, 'Nie ma takiej zakładki');
	return { zakladka };
};
