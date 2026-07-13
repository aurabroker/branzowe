<script lang="ts">
	import { stan, DB } from './stan.svelte';
	import { formatujZl, RZYMSKIE } from '$lib/domena/skladka';
	import type { WariantIdx } from '$lib/domena/typy';

	const gdInfo = DB.global_doctors;
	const pakietyWidoczne = $derived(
		DB.pakiety_dodatkowe.filter((p) => stan.pokaz3 || p.podgrupy_operacji !== 3)
	);
	const maOpcje = $derived(
		stan.medi.length > 0 || stan.gd || Object.keys(stan.pakiety).length > 0
	);

	function przelaczMedi(slug: string) {
		stan.medi = stan.medi.includes(slug)
			? stan.medi.filter((s) => s !== slug)
			: [...stan.medi, slug];
	}
	function przelaczPakiet(slug: string) {
		const kopia = { ...stan.pakiety };
		if (slug in kopia) delete kopia[slug];
		else kopia[slug] = 0;
		stan.pakiety = kopia;
	}
	function wariantPakietu(slug: string, i: WariantIdx) {
		stan.pakiety = { ...stan.pakiety, [slug]: i };
	}
</script>

<div class="eyebrow">Krok 3</div>
<h2 class="t">Co udostępniasz pracownikom</h2>
<p class="sub">
	Składkę za wszystko płacisz Ty — ale to pracownik decyduje w swojej deklaracji, które rozszerzenia
	weźmie. Zaznacz więc, <b>co ma zobaczyć w menu</b>.
</p>

<div class="warnbox" style="margin-top:18px">
	<b>Twój koszt to widełki, nie liczba.</b> Dopiero po zebraniu deklaracji od zespołu wiadomo, ile
	osób wzięło co. Poniżej możesz założyć, jaka część zespołu skorzysta — żeby zaplanować budżet.
</div>

{#if maOpcje}
	<div class="adopt">
		<label for="adopt">
			Zakładam, że rozszerzenia wybierze
			<b style="color:var(--red)">{Math.round(stan.adopcja * 100)}%</b> zespołu
		</label>
		<input
			id="adopt"
			type="range"
			min="0"
			max="100"
			step="5"
			value={Math.round(stan.adopcja * 100)}
			oninput={(e) => (stan.adopcja = +e.currentTarget.value / 100)}
		/>
		<div class="krance"><span>nikt (koszt minimalny)</span><span>wszyscy (koszt maksymalny)</span></div>
	</div>
{/if}

<h3 class="sec">MediOpieka <small>· assistance i świadczenia medyczne, realizowane w Polsce</small></h3>
<div class="addgrid">
	{#each DB.mediopieka as m (m.slug)}
		<button class="add" class:sel={stan.medi.includes(m.slug)} onclick={() => przelaczMedi(m.slug)}>
			<span class="cb">{stan.medi.includes(m.slug) ? '✓' : ''}</span>
			<span class="bd"><strong>{m.nazwa}</strong><small>{m.opis || ''}</small></span>
			<span class="pr">{formatujZl(m.skladka)}<s>/os./mies.</s></span>
		</button>
	{/each}
</div>

<h3 class="sec">Global Doctors <small>· leczenie za granicą, suma 2 mln €</small></h3>
<div class="addgrid">
	<button class="add szeroki" class:sel={stan.gd} onclick={() => (stan.gd = !stan.gd)}>
		<span class="cb">{stan.gd ? '✓' : ''}</span>
		<span class="bd">
			<strong>{gdInfo.nazwa}</strong>
			<small>
				Organizacja i pokrycie kosztów leczenia w klinikach za granicą — nowotwory, zastawki serca,
				by-passy, neurochirurgia, przeszczepy. Suma <b>{gdInfo.suma_ubezpieczenia}</b>. Dodatkowo
				zgon ubezpieczonego {formatujZl(gdInfo.zgon_ubezpieczonego)}.<br />
				<b style="color:var(--warn)">Wiek {gdInfo.wiek.min}–{gdInfo.wiek.max} lat</b> · wymagane 183 dni
				pobytu w PL w ostatnich 12 mies.
			</small>
		</span>
		<span class="pr">{formatujZl(gdInfo.skladka)}<s>/os./mies.</s></span>
	</button>
</div>

<h3 class="sec">Pakiety dodatkowe <small>· każdy w 3 wariantach</small></h3>
<p style="font-size:13px;color:var(--gray);margin-top:8px">
	Pakiet główny rozlicza operacje w <b>5 podgrupach</b>, więc domyślnie pokazujemy zgodne z nim
	pakiety 5-podgrupowe.
	<button class="link" onclick={() => (stan.pokaz3 = !stan.pokaz3)}>
		{stan.pokaz3 ? 'ukryj warianty 3-podgrupowe' : 'pokaż też warianty 3-podgrupowe'}
	</button>
</p>
<div class="addgrid">
	{#each pakietyWidoczne as p (p.slug)}
		{@const wybrany = p.slug in stan.pakiety}
		{@const wi = stan.pakiety[p.slug] ?? 0}
		<div
			class="add"
			class:sel={wybrany}
			onclick={() => przelaczPakiet(p.slug)}
			role="checkbox"
			aria-checked={wybrany}
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && przelaczPakiet(p.slug)}
		>
			<span class="cb">{wybrany ? '✓' : ''}</span>
			<span class="bd">
				<strong>{p.nazwa}</strong>
				{#if p.podgrupy_operacji === 3}
					<small style="color:var(--warn)">⚠ Niezgodny z pakietem głównym (5 podgrup operacji).</small>
				{/if}
				{#if p.uwaga}<small>{p.uwaga}</small>{/if}
				<span class="vsel">
					{#each [0, 1, 2] as const as i (i)}
						<button
							class:on={wybrany && wi === i}
							onclick={(e) => {
								e.stopPropagation();
								wariantPakietu(p.slug, i);
							}}
						>
							W{RZYMSKIE[i]} · {formatujZl(p.skladka[i])}
						</button>
					{/each}
				</span>
			</span>
			<span class="pr">{formatujZl(p.skladka[wybrany ? wi : 0])}<s>/os./mies.</s></span>
		</div>
	{/each}
</div>

<div class="nav-krok">
	<button class="btn ghost" onclick={() => stan.idz(2)}>← Wstecz</button>
	<button class="btn" onclick={() => stan.idz(4)}>Dalej: struktura zespołu →</button>
</div>

<style>
	.adopt {
		margin-top: 22px;
		border: 1px solid var(--line);
		padding: 18px 20px;
		max-width: 640px;
	}
	.adopt label {
		font-size: 12.5px;
		font-weight: 500;
		display: block;
	}
	.adopt input {
		width: 100%;
		margin-top: 12px;
		accent-color: var(--red);
	}
	.krance {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: #9a9a9a;
		margin-top: 2px;
	}
	h3.sec {
		margin-top: 36px;
		font-size: 16px;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	h3.sec:after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}
	h3.sec small {
		font-weight: 400;
		color: var(--gray);
		font-size: 12.5px;
	}
	.addgrid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
		margin-top: 18px;
	}
	.add {
		border: 1px solid var(--line);
		padding: 16px 18px;
		display: flex;
		gap: 14px;
		align-items: flex-start;
		background: #fff;
		cursor: pointer;
		text-align: left;
		font-size: inherit;
	}
	.add.szeroki {
		grid-column: span 2;
	}
	.add.sel {
		border-color: var(--red);
		background: #fef7f8;
	}
	.cb {
		flex: 0 0 20px;
		width: 20px;
		height: 20px;
		border: 2px solid var(--line);
		border-radius: 2px;
		margin-top: 2px;
		display: grid;
		place-items: center;
		color: #fff;
		font-size: 13px;
		font-weight: 700;
	}
	.add.sel .cb {
		background: var(--red);
		border-color: var(--red);
	}
	.bd {
		flex: 1;
	}
	.bd strong {
		display: block;
		font-size: 14.5px;
	}
	.bd small {
		display: block;
		color: var(--gray);
		font-size: 12.5px;
		margin-top: 3px;
		line-height: 1.4;
	}
	.pr {
		font-weight: 900;
		white-space: nowrap;
		font-size: 15px;
	}
	.pr s {
		display: block;
		font-size: 10px;
		font-weight: 400;
		color: #9a9a9a;
		text-decoration: none;
		text-align: right;
	}
	.vsel {
		display: flex;
		gap: 4px;
		margin-top: 10px;
	}
	.vsel button {
		flex: 1;
		border: 1px solid var(--line);
		background: #fff;
		font-size: 11px;
		padding: 5px 2px;
		cursor: pointer;
		color: var(--gray);
	}
	.vsel button.on {
		background: var(--ink);
		color: #fff;
		border-color: var(--ink);
	}
	.link {
		background: 0;
		border: 0;
		color: var(--red);
		text-decoration: underline;
		cursor: pointer;
		font-size: 13px;
		font-family: inherit;
	}
	@media (max-width: 900px) {
		.addgrid {
			grid-template-columns: 1fr;
		}
		.add.szeroki {
			grid-column: span 1;
		}
	}
</style>
