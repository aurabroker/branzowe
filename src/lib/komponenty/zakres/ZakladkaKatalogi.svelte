<script lang="ts">
	interface PZ {
		lp: number;
		nazwa: string;
		definicja?: string;
	}
	interface Operacja {
		lp: number;
		nazwa: string;
		sekcja: string | null;
		grupa_5podgrup: number;
		grupa_3podgrupy: number;
	}
	interface IndeksOperacji {
		liczba: number;
		stron: number;
		stawki: { '5_podgrup': Record<string, string>; '3_podgrupy': Record<string, string> };
	}

	let pz = $state<PZ[] | null>(null);
	let operacje = $state<Operacja[] | null>(null);
	let indeks = $state<IndeksOperacji | null>(null);
	let blad = $state(false);

	let szukajPz = $state('');
	let szukajOp = $state('');
	let filtrGrupa = $state(0); // 0 = wszystkie

	$effect(() => {
		(async () => {
			try {
				const [odpPz, odpIdx] = await Promise.all([
					fetch('/dane/owu/powazne-zachorowania.json'),
					fetch('/dane/owu/operacje-indeks.json')
				]);
				pz = (await odpPz.json()).pozycje as PZ[];
				indeks = (await odpIdx.json()) as IndeksOperacji;
				const strony = await Promise.all(
					Array.from({ length: indeks.stron }, (_, i) =>
						fetch(`/dane/owu/operacje-${i + 1}.json`).then((r) => r.json())
					)
				);
				operacje = strony.flat() as Operacja[];
			} catch {
				blad = true;
			}
		})();
	});

	const pzWidoczne = $derived(
		(pz ?? []).filter(
			(p) =>
				!szukajPz ||
				(p.nazwa + ' ' + (p.definicja ?? '')).toLowerCase().includes(szukajPz.toLowerCase())
		)
	);
	const opWidoczne = $derived(
		(operacje ?? []).filter(
			(o) =>
				(!filtrGrupa || o.grupa_5podgrup === filtrGrupa) &&
				(!szukajOp ||
					o.nazwa.toLowerCase().includes(szukajOp.toLowerCase()) ||
					(o.sekcja ?? '').toLowerCase().includes(szukajOp.toLowerCase()))
		)
	);
</script>

<h2 class="naglowek">Katalogi świadczeń z OWU</h2>
<p class="lead">
	Pełne, przeszukiwalne katalogi z załączników OWU EZwB 01/25: {pz?.length ?? 104} poważnych
	zachorowań i {indeks?.liczba ?? 602} operacji chirurgicznych.
</p>

{#if blad}
	<div class="warnbox">Nie udało się wczytać katalogów. Odśwież stronę.</div>
{/if}

<section class="cat">
	<h3>Poważne zachorowania — {pz?.length ?? '…'} pozycji</h3>
	<input class="search" placeholder="Szukaj choroby — np. nowotwór, udar, sepsa…" bind:value={szukajPz} />
	<div class="lista">
		{#if !pz}
			<p class="info">Wczytuję katalog…</p>
		{:else if !pzWidoczne.length}
			<p class="info">Nie znaleziono pozycji.</p>
		{:else}
			{#each pzWidoczne as p (p.lp)}
				<details>
					<summary><span class="lp">{p.lp}</span>{p.nazwa}</summary>
					{#if p.definicja}<div class="def">{p.definicja}</div>{/if}
				</details>
			{/each}
		{/if}
	</div>
</section>

<section class="cat">
	<h3>Operacje chirurgiczne — {indeks?.liczba ?? '…'} pozycji w 5 podgrupach</h3>
	{#if indeks}
		<p class="info" style="padding:0 0 10px">
			Stawki: {#each Object.entries(indeks.stawki['5_podgrup']) as [g, s] (g)}G{g} = {s}&nbsp; {/each}
			(pakiet główny). Katalog 3-podgrupowy: {#each Object.entries(indeks.stawki['3_podgrupy']) as [g, s] (g)}G{g} = {s}&nbsp;{/each}
		</p>
	{/if}
	<div class="filtry">
		{#each [0, 1, 2, 3, 4, 5] as g (g)}
			<button class:on={filtrGrupa === g} onclick={() => (filtrGrupa = g)}>
				{g ? `Grupa ${g}` : 'Wszystkie'}
			</button>
		{/each}
	</div>
	<input class="search" placeholder="Szukaj operacji lub układu — np. kraniotomia, serce…" bind:value={szukajOp} />
	<div class="lista">
		{#if !operacje}
			<p class="info">Wczytuję katalog…</p>
		{:else if !opWidoczne.length}
			<p class="info">Nie znaleziono operacji.</p>
		{:else}
			{#each opWidoczne as o, i (o.lp)}
				{#if i === 0 || opWidoczne[i - 1].sekcja !== o.sekcja}
					<div class="sekcja">{o.sekcja ?? '—'}</div>
				{/if}
				<div class="op">
					<span><span class="lp">{o.lp}</span>{o.nazwa}</span>
					<span class="stawki">
						<b>{indeks?.stawki['5_podgrup'][String(o.grupa_5podgrup)]}</b>
						<span class="alt">· 3-podgr. {indeks?.stawki['3_podgrupy'][String(o.grupa_3podgrupy)]}</span>
					</span>
				</div>
			{/each}
		{/if}
	</div>
</section>

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
	.cat {
		margin-bottom: 36px;
	}
	.cat h3 {
		font-size: 17px;
		font-weight: 700;
		margin-bottom: 10px;
	}
	.search {
		width: 100%;
		border: 1px solid var(--line);
		padding: 11px 14px;
		font-size: 14px;
		font-family: inherit;
		margin-bottom: 10px;
	}
	.search:focus {
		outline: 2px solid var(--red);
		outline-offset: -1px;
	}
	.lista {
		max-height: 560px;
		overflow: auto;
		border: 1px solid var(--line);
	}
	.info {
		padding: 20px;
		color: var(--gray);
		font-size: 13.5px;
	}
	details {
		border-bottom: 1px solid #f2f2f2;
	}
	summary {
		padding: 10px 14px;
		cursor: pointer;
		list-style: none;
		font-size: 13.5px;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.def {
		padding: 0 14px 12px 40px;
		font-size: 12.5px;
		color: var(--gray);
		line-height: 1.55;
	}
	.lp {
		color: #bbb;
		font-size: 11px;
		margin-right: 8px;
	}
	.filtry {
		display: flex;
		gap: 6px;
		margin-bottom: 10px;
		flex-wrap: wrap;
	}
	.filtry button {
		border: 1px solid var(--line);
		background: #fff;
		color: var(--gray);
		font-size: 12px;
		padding: 6px 12px;
		cursor: pointer;
	}
	.filtry button.on {
		background: var(--ink);
		color: #fff;
		border-color: var(--ink);
	}
	.sekcja {
		background: var(--surf);
		padding: 8px 14px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 700;
		color: var(--gray);
		position: sticky;
		top: 0;
	}
	.op {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 14px;
		border-bottom: 1px solid #f2f2f2;
		font-size: 13.5px;
	}
	.stawki {
		white-space: nowrap;
	}
	.stawki b {
		color: var(--red);
	}
	.alt {
		color: #bbb;
		font-size: 11px;
	}
</style>
