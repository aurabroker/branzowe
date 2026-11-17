<script lang="ts">
	import { page } from '$app/state';
	import { stan, DB } from '$lib/komponenty/wniosek/stan.svelte';
	import Krok1 from '$lib/komponenty/wniosek/Krok1Branza.svelte';
	import Krok2 from '$lib/komponenty/wniosek/Krok2Wariant.svelte';
	import Krok3 from '$lib/komponenty/wniosek/Krok3Rozszerzenia.svelte';
	import Krok4 from '$lib/komponenty/wniosek/Krok4Struktura.svelte';
	import Krok5 from '$lib/komponenty/wniosek/Krok5Firma.svelte';
	import Krok6 from '$lib/komponenty/wniosek/Krok6Zgody.svelte';
	import PasekSkladki from '$lib/komponenty/wniosek/PasekSkladki.svelte';

	const KROKI = ['Branża', 'Wariant', 'Rozszerzenia', 'Struktura', 'Firma', 'Zgody'];

	stan.wczytaj();

	// wejście z landingu: /wniosek?branza=slug
	const zUrl = page.url.searchParams.get('branza');
	if (zUrl && DB.branze.some((b) => b.slug === zUrl) && stan.branza !== zUrl) {
		stan.branza = zUrl;
		stan.wariant = 0;
		stan.pakiety = {};
		if (stan.krok === 1) stan.krok = 2;
	}
</script>

<svelte:head>
	<title>Kreator wniosku — ERGO Życie w Biznesie</title>
	<!-- krok lejka, nie strona docelowa — poza indeksem wyszukiwarek -->
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<nav class="stepper">
	<div class="wrap">
		{#each KROKI as t, i (t)}
			{@const n = i + 1}
			<button
				class:on={n === stan.krok}
				class:done={n < stan.krok}
				disabled={n > stan.krok}
				onclick={() => n < stan.krok && stan.idz(n)}
			>
				<b>{n < stan.krok ? '✓' : n}</b>{t}
			</button>
		{/each}
	</div>
</nav>

<main class="wrap tresc">
	{#if stan.krok === 1}
		<Krok1 />
	{:else if stan.krok === 2}
		<Krok2 />
	{:else if stan.krok === 3}
		<Krok3 />
	{:else if stan.krok === 4}
		<Krok4 />
	{:else if stan.krok === 5}
		<Krok5 />
	{:else if stan.krok === 6}
		<Krok6 />
	{/if}
</main>

<PasekSkladki />

<style>
	.stepper {
		border-bottom: 1px solid var(--line);
		background: var(--surf2);
		position: sticky;
		top: 64px;
		z-index: 30;
	}
	.stepper .wrap {
		display: flex;
		gap: 2px;
		overflow-x: auto;
	}
	.stepper button {
		background: 0;
		border: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 18px 12px;
		font-size: 13px;
		color: #9a9a9a;
		white-space: nowrap;
		border-bottom: 3px solid transparent;
		cursor: default;
	}
	.stepper button b {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #dcdcdc;
		color: #fff;
		font-size: 11px;
		font-weight: 700;
	}
	.stepper button.on {
		color: var(--ink);
		border-bottom-color: var(--red);
		font-weight: 500;
	}
	.stepper button.on b {
		background: var(--red);
	}
	.stepper button.done {
		color: var(--gray);
		cursor: pointer;
	}
	.stepper button.done b {
		background: var(--ok);
	}
	.tresc {
		padding: 48px 24px 160px;
		animation: fade 0.28s ease;
	}
	@keyframes fade {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
