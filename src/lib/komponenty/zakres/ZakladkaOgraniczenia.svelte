<script lang="ts">
	interface Punkt {
		nr?: number;
		tresc: string;
	}
	interface Rozdzial {
		nr: number;
		nazwa: string;
		strona: number;
		kod: string | null;
		karencja: Punkt[];
		wylaczenia: Punkt[];
		dokumenty: Punkt[];
	}
	interface Meta {
		wylaczenia_wspolne_top: { tresc_prefix: string; liczba_wystapien: number }[];
		statystyki: { rozdzialow: number; punktow_wylaczen: number; punktow_karencji: number };
		mediopieka_statystyki: { swiadczen_mediopieki: number; punktow_wylaczen: number };
	}

	let ezb = $state<Rozdzial[] | null>(null);
	let mo = $state<Rozdzial[] | null>(null);
	let meta = $state<Meta | null>(null);
	let blad = $state(false);
	let szukaj = $state('');

	$effect(() => {
		(async () => {
			try {
				const [a, b, c] = await Promise.all([
					fetch('/dane/owu/rozdzialy-ezb.json'),
					fetch('/dane/owu/rozdzialy-mo.json'),
					fetch('/dane/owu/owu-meta.json')
				]);
				ezb = (await a.json()) as Rozdzial[];
				mo = (await b.json()) as Rozdzial[];
				meta = (await c.json()) as Meta;
			} catch {
				blad = true;
			}
		})();
	});

	const ezbWidoczne = $derived(
		(ezb ?? []).filter(
			(r) =>
				(r.wylaczenia.length || r.karencja.length) &&
				(!szukaj || r.nazwa.toLowerCase().includes(szukaj.toLowerCase()))
		)
	);

	const skroc = (t: string) => (t.length > 600 ? t.slice(0, 600) + '…' : t);
</script>

<h2 class="naglowek">Karencje i wyłączenia odpowiedzialności</h2>
<p class="lead">
	Każde świadczenie ma własny rozdział OWU z listą wyłączeń i karencji. Poniżej wyciąg wprost z OWU
	EZwB 01/25 i MA 01/25 — bez interpretacji.
</p>

{#if blad}
	<div class="warnbox">Nie udało się wczytać danych OWU. Odśwież stronę.</div>
{/if}

{#if meta}
	<section class="cat">
		<h3>Wyłączenia najczęstsze — dotyczą większości świadczeń</h3>
		<p class="pod">
			Te wyłączenia powtarzają się w wielu rozdziałach OWU, z faktyczną liczbą świadczeń, których
			dotyczą.
		</p>
		{#each meta.wylaczenia_wspolne_top as w (w.tresc_prefix)}
			<div class="wsp">
				<div class="ile">DOTYCZY {w.liczba_wystapien} ŚWIADCZEŃ</div>
				{w.tresc_prefix}…
			</div>
		{/each}
	</section>
{/if}

<section class="cat">
	<h3>
		Ograniczenia per świadczenie
		{#if meta}
			— {meta.statystyki.rozdzialow} rozdziałów, {meta.statystyki.punktow_wylaczen} wyłączeń,
			{meta.statystyki.punktow_karencji} karencji
		{/if}
	</h3>
	<input class="search" placeholder="Szukaj świadczenia — np. zgon, uszczerbek, nowotwór…" bind:value={szukaj} />
	<div class="lista">
		{#if !ezb}
			<p class="info">Wczytuję rozdziały OWU…</p>
		{:else if !ezbWidoczne.length}
			<p class="info">Nie znaleziono świadczenia.</p>
		{:else}
			{#each ezbWidoczne as r (r.nr)}
				<details>
					<summary>
						<span><span class="lp">R{r.nr}</span><b>{r.nazwa}</b></span>
						<span class="licz">{r.wylaczenia.length} wył. · {r.karencja.length} kar.</span>
					</summary>
					<div class="szcz">
						{#if r.wylaczenia.length}
							<h4 class="wyl">Wyłączenia ({r.wylaczenia.length})</h4>
							{#each r.wylaczenia as w, i (i)}<div class="p">{skroc(w.tresc)}</div>{/each}
						{/if}
						{#if r.karencja.length}
							<h4 class="kar">Karencje ({r.karencja.length})</h4>
							{#each r.karencja as k, i (i)}<div class="p">{skroc(k.tresc)}</div>{/each}
						{/if}
					</div>
				</details>
			{/each}
		{/if}
	</div>
</section>

<section class="cat">
	<h3>
		MediOpieka
		{#if meta}
			— {meta.mediopieka_statystyki.swiadczen_mediopieki} świadczeń, {meta.mediopieka_statystyki
				.punktow_wylaczen} punktów wyłączeń
		{/if}
	</h3>
	<p class="pod">Osobne OWU dla assistance i świadczeń medycznych. Kod: MA 01/25.</p>
	<div class="lista" style="max-height:520px">
		{#if !mo}
			<p class="info">Wczytuję…</p>
		{:else}
			{#each mo.filter((r) => r.kod) as r (r.nr)}
				<details>
					<summary>
						<span><span class="lp">R{r.nr}</span><b>{r.nazwa}</b></span>
						<span class="licz">{r.wylaczenia.length} wył.</span>
					</summary>
					<div class="szcz">
						{#if r.wylaczenia.length}
							<h4 class="wyl">Wyłączenia ({r.wylaczenia.length})</h4>
							{#each r.wylaczenia as w, i (i)}<div class="p">{skroc(w.tresc)}</div>{/each}
						{/if}
					</div>
				</details>
			{/each}
		{/if}
	</div>
</section>

<div class="note">
	Materiał informacyjny — nie jest ofertą w rozumieniu art. 66 k.c. Wiążące są wyłącznie OWU:
	<b>EZwB 01/25</b>, <b>MA 01/25</b>, <b>GD-GZ 01/25</b>.
</div>

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
	.pod {
		font-size: 13.5px;
		color: var(--gray);
		margin-bottom: 12px;
	}
	.wsp {
		padding: 14px 16px;
		border: 1px solid var(--line);
		margin-bottom: 8px;
		font-size: 13.5px;
	}
	.ile {
		font-size: 11px;
		color: var(--red);
		font-weight: 700;
		letter-spacing: 0.6px;
		margin-bottom: 6px;
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
		max-height: 640px;
		overflow: auto;
		border: 1px solid var(--line);
	}
	.info {
		padding: 20px;
		color: var(--gray);
	}
	details {
		border-bottom: 1px solid #efefef;
	}
	summary {
		padding: 12px 16px;
		cursor: pointer;
		list-style: none;
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-size: 14px;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.lp {
		color: #bbb;
		font-size: 11px;
		margin-right: 8px;
	}
	.licz {
		color: var(--gray);
		font-size: 12px;
		white-space: nowrap;
	}
	.szcz {
		padding: 0 16px 14px 40px;
	}
	.szcz h4 {
		font-size: 11px;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		margin: 8px 0;
	}
	h4.wyl {
		color: var(--red);
	}
	h4.kar {
		color: var(--warn);
		margin-top: 12px;
	}
	.p {
		font-size: 12.5px;
		color: var(--gray);
		padding: 6px 0;
		border-top: 1px dotted #eee;
	}
</style>
