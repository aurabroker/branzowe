<script lang="ts">
	import { ZAKLADKI } from '$lib/komponenty/zakres/zakladki';
	import ZakladkaPakiety from '$lib/komponenty/zakres/ZakladkaPakiety.svelte';
	import ZakladkaKatalogi from '$lib/komponenty/zakres/ZakladkaKatalogi.svelte';
	import ZakladkaOgraniczenia from '$lib/komponenty/zakres/ZakladkaOgraniczenia.svelte';
	import ZakladkaSlowniczek from '$lib/komponenty/zakres/ZakladkaSlowniczek.svelte';

	let { data } = $props();
	const slug = $derived(data.zakladka.slug);
</script>

<svelte:head>
	<title>{data.zakladka.tytul} — zakres ochrony ERGO Życie w Biznesie</title>
	<meta
		name="description"
		content="Zakres ochrony ERGO Życie w Biznesie: pakiety dodatkowe, katalog 104 poważnych zachorowań i 602 operacji, karencje i wyłączenia z OWU EZwB 01/25."
	/>
</svelte:head>

<div class="hd">
	<div class="wrap">
		<div class="cap">Zakres ochrony · materiał informacyjny</div>
		<h1>Co naprawdę obejmuje ERGO Życie w Biznesie</h1>
		<p>
			Pakiety dodatkowe, pełne katalogi świadczeń i ograniczenia odpowiedzialności — z ulotek i OWU
			(EZwB 01/25, MA 01/25, GD-GZ 01/25). Wiążące są wyłącznie OWU.
		</p>
		<nav class="tabs">
			{#each ZAKLADKI as z (z.slug)}
				<a href="/zakres-ochrony/{z.slug}" class:on={z.slug === slug}>{z.tytul}</a>
			{/each}
		</nav>
	</div>
</div>

<main class="wrap tresc">
	{#if slug === 'pakiety'}
		<ZakladkaPakiety />
	{:else if slug === 'katalogi'}
		<ZakladkaKatalogi />
	{:else if slug === 'ograniczenia'}
		<ZakladkaOgraniczenia />
	{:else}
		<ZakladkaSlowniczek />
	{/if}
</main>

<style>
	.hd {
		background: var(--ink);
		color: #fff;
		padding: 44px 0 0;
	}
	.hd h1 {
		font-size: clamp(26px, 3.6vw, 40px);
		font-weight: 900;
		letter-spacing: -1px;
	}
	.hd p {
		color: #c5c5c5;
		margin-top: 8px;
		max-width: 60ch;
		font-weight: 300;
	}
	.tabs {
		display: flex;
		gap: 0;
		margin-top: 32px;
		overflow-x: auto;
	}
	.tabs a {
		border-bottom: 3px solid transparent;
		color: #9c9c9c;
		font-size: 14px;
		padding: 14px 20px;
		white-space: nowrap;
		text-decoration: none;
	}
	.tabs a.on {
		color: #fff;
		border-bottom-color: var(--red);
		font-weight: 700;
	}
	.tabs a:hover {
		color: #fff;
	}
	.tresc {
		padding: 40px 24px 80px;
	}
</style>
