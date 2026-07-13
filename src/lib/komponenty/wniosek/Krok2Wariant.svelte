<script lang="ts">
	import { stan, DB } from './stan.svelte';
	import {
		formatujZl,
		formatujSwiadczenie,
		wariantyNiemonotoniczne,
		RZYMSKIE
	} from '$lib/domena/skladka';
	import type { WariantIdx } from '$lib/domena/typy';

	const HERO = [
		'zgon',
		'pz_max',
		'operacja',
		'szpital_choroba',
		'tu_nw',
		'niezdolnosc_nw',
		'niezdolnosc_choroba_nw',
		'zgon_malzonka',
		'zgon_dziecka'
	];

	const b = $derived(stan.branzaObj!);
	const niemono = $derived(b ? wariantyNiemonotoniczne(b) : false);

	function liczbaSwiadczen(i: WariantIdx): number {
		return Object.values(b.s).filter((v) => v[i] != null).length;
	}
</script>

{#if b}
	<div class="eyebrow">Krok 2 · {b.nazwa}</div>
	<h2 class="t">Wybierz wariant</h2>
	<p class="sub">
		Trzy warianty programu dla branży {b.nazwa.toLowerCase()}. Różnią się nie tylko ceną — mają inny
		rozkład sum ubezpieczenia, a część z nich w ogóle nie zawiera świadczeń dla rodziny.
	</p>

	{#if niemono}
		<div class="warnbox">
			<b>Uwaga:</b> w tej branży Wariant III ma <b>wyższą</b> sumę na zgon niż Wariant I ({formatujZl(
				b.s.zgon[2]!
			)} vs {formatujZl(b.s.zgon[0]!)}). Warianty nie są uszeregowane „od najsłabszego do
			najmocniejszego” — porównuj zakres, nie numer.
		</div>
	{/if}

	<div class="vars">
		{#each [0, 1, 2] as const as i (i)}
			<button class="var" class:sel={stan.wariant === i} onclick={() => (stan.wariant = i)}>
				<span class="rb"></span>
				<h3>Wariant {RZYMSKIE[i]}</h3>
				<div class="price">{formatujZl(b.skladka[i])}<s> / os. / mies.</s></div>
				<div class="cnt">
					{liczbaSwiadczen(i)} świadczeń · część na zgon: {formatujZl(b.skladka_zgon[i])}
				</div>
				<ul>
					{#each HERO.filter((c) => b.s[c]) as c (c)}
						{@const v = b.s[c][i]}
						<li class:na={v == null}>
							<span>{DB.swiadczenia[c].l}</span><b>{formatujSwiadczenie(DB, c, v)}</b>
						</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>

	<details class="full">
		<summary>Pełna tabela świadczeń — wszystkie pozycje dla tej branży</summary>
		<div class="tblwrap">
			<table>
				<thead>
					<tr>
						<th>Świadczenie</th><th>Wariant I</th><th>Wariant II</th><th>Wariant III</th><th>Karencja</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(DB.grupy) as [g, etykieta] (g)}
						{@const kody = Object.keys(b.s).filter((c) => DB.swiadczenia[c].g === g)}
						{#if kody.length}
							<tr class="grp"><td colspan="5">{etykieta}</td></tr>
							{#each kody as c (c)}
								{@const m = DB.swiadczenia[c]}
								<tr>
									<td>
										{m.l}
										{#if m.dni}<span style="color:#AAA;font-size:11px"> (dni {m.dni})</span>{/if}
									</td>
									{#each [0, 1, 2] as const as i (i)}
										{@const v = b.s[c][i]}
										<td class="v" class:no={v == null} class:hl={i === stan.wariant && v != null}>
											{formatujSwiadczenie(DB, c, v)}
										</td>
									{/each}
									<td class="k">{m.k}</td>
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	</details>

	<div class="note">
		Kwoty w osobnych wierszach <b>nie kumulują się</b> — wartość w wierszu to już skumulowana kwota
		świadczeń (np. w zgonie w wyniku wypadku zawarta jest kwota za zgon). Szczegóły, wyłączenia i
		ograniczenia: OWU <b>EZwB 01/25</b>.
	</div>

	<div class="nav-krok">
		<button class="btn ghost" onclick={() => stan.idz(1)}>← Wstecz</button>
		<button class="btn" onclick={() => stan.idz(3)}>Dalej: rozszerzenia →</button>
	</div>
{/if}

<style>
	.vars {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-top: 28px;
	}
	.var {
		border: 1px solid var(--line);
		padding: 22px;
		cursor: pointer;
		background: #fff;
		transition: 0.18s;
		position: relative;
		text-align: left;
	}
	.var:hover {
		border-color: #b9b9b9;
	}
	.var.sel {
		border-color: var(--red);
		box-shadow: 0 0 0 2px var(--red) inset;
	}
	.rb {
		position: absolute;
		top: 20px;
		right: 20px;
		width: 18px;
		height: 18px;
		border: 2px solid var(--line);
		border-radius: 50%;
	}
	.var.sel .rb {
		border-color: var(--red);
		background: radial-gradient(circle, var(--red) 45%, transparent 47%);
	}
	.var h3 {
		font-size: 13px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--gray);
		font-weight: 700;
	}
	.price {
		margin: 12px 0 4px;
		font-size: 38px;
		font-weight: 900;
		letter-spacing: -1.5px;
	}
	.price s {
		font-size: 15px;
		font-weight: 400;
		text-decoration: none;
		color: var(--gray);
		letter-spacing: 0;
	}
	.cnt {
		font-size: 12px;
		color: #8a8a8a;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--line);
	}
	.var ul {
		list-style: none;
		margin-top: 14px;
	}
	.var li {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-size: 13px;
		padding: 7px 0;
		border-bottom: 1px dotted #eaeaea;
	}
	.var li span {
		color: var(--gray);
	}
	.var li b {
		white-space: nowrap;
		font-weight: 700;
	}
	.var li.na b {
		color: #c4c4c4;
		font-weight: 400;
	}
	details.full {
		margin-top: 22px;
		border: 1px solid var(--line);
	}
	details.full summary {
		padding: 14px 18px;
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
		background: var(--surf2);
		list-style: none;
		display: flex;
		justify-content: space-between;
	}
	details.full summary::after {
		content: 'pokaż ▾';
		color: var(--red);
		font-size: 12px;
	}
	details.full[open] summary::after {
		content: 'ukryj ▴';
	}
	@media (max-width: 900px) {
		.vars {
			grid-template-columns: 1fr;
		}
	}
</style>
