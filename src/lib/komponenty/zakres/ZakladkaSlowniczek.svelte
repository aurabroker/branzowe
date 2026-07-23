<script lang="ts">
	import marketing from '$lib/dane/zakres-marketing.json';

	interface Haslo {
		termin: string;
		wyjasnienie: string;
		zrodlo: string;
	}

	const wlasne: Haslo[] = (
		marketing.slowniczek.hasla as { termin: string; wyjasnienie: string }[]
	).map((h) => ({ ...h, zrodlo: 'wyjaśnienie potoczne' }));

	let zOwu = $state<Haslo[]>([]);
	let szukaj = $state('');

	$effect(() => {
		fetch('/dane/owu/slowniczek.json')
			.then((r) => r.json())
			.then(
				(hasla: { termin: string; definicja: string }[]) =>
					(zOwu = hasla.map((h) => ({
						termin: h.termin,
						wyjasnienie: h.definicja,
						zrodlo: 'OWU MediOpieka (MA 01/25)'
					})))
			)
			.catch(() => {});
	});

	const wszystkie = $derived([...wlasne, ...zOwu]);
	const widoczne = $derived(
		wszystkie.filter(
			(x) =>
				!szukaj || (x.termin + ' ' + x.wyjasnienie).toLowerCase().includes(szukaj.toLowerCase())
		)
	);
</script>

<h2 class="naglowek">Słowniczek pojęć</h2>
<p class="lead">
	Pojęcia z ulotek wyjaśnione po ludzku oraz definicje wiążące z OWU MediOpieki. W razie rozbieżności
	decyduje definicja z OWU.
</p>

<input class="search" placeholder="Szukaj pojęcia — np. karencja, suma ubezpieczenia…" bind:value={szukaj} />

{#if widoczne.length}
	<div class="hasla">
		{#each widoczne as x (x.zrodlo + x.termin)}
			<div class="gl">
				<dt>{x.termin}</dt>
				<dd>{x.wyjasnienie}</dd>
				<span class="src">{x.zrodlo}</span>
			</div>
		{/each}
	</div>
{:else}
	<p style="color:var(--gray);padding:20px 0">Nie znaleziono pojęcia. Spróbuj innego słowa.</p>
{/if}

<style>
	.naglowek {
		font-size: 24px;
		font-weight: 900;
		letter-spacing: -0.5px;
		margin-bottom: 6px;
	}
	.lead {
		color: var(--gray);
		margin-bottom: 24px;
		max-width: 72ch;
	}
	.search {
		width: 100%;
		max-width: 560px;
		border: 1px solid var(--line);
		padding: 11px 14px;
		font-size: 14px;
		font-family: inherit;
		margin-bottom: 20px;
	}
	.search:focus {
		outline: 2px solid var(--red);
		outline-offset: -1px;
	}
	.hasla {
		columns: 2;
		column-gap: 26px;
	}
	.gl {
		break-inside: avoid;
		border: 1px solid var(--line);
		padding: 14px 16px;
		margin-bottom: 14px;
	}
	dt {
		font-weight: 700;
		font-size: 14.5px;
	}
	dd {
		font-size: 13px;
		color: var(--gray);
		margin-top: 4px;
		line-height: 1.5;
	}
	.src {
		display: block;
		margin-top: 8px;
		font-size: 11px;
		color: #9a9a9a;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	@media (max-width: 900px) {
		.hasla {
			columns: 1;
		}
	}
</style>
