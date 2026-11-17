import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		prerender: {
			// Pliki OWU (PDF ERGO Hestii) dogrywane są ręcznie do static/dokumenty/.
			// Dopóki ich brak, link 404 nie przerywa builda; każdy INNY martwy link nadal jest błędem.
			handleHttpError: ({ path, message }) => {
				if (/^\/dokumenty\/owu-[a-z-]+\.pdf$/.test(path)) {
					console.warn(`prerender: brak pliku OWU (do dogrania): ${path}`);
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
