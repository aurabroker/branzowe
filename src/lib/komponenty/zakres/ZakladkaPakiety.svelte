<script lang="ts">
	import marketing from '$lib/dane/zakres-marketing.json';
	import produkty from '$lib/dane/produkty.json';
	import type { Produkty } from '$lib/domena/typy';
	import { formatujZl, RZYMSKIE } from '$lib/domena/skladka';
	import { tabelaPakietu, MAPA_MARKETING_CENNIK, type WierszPakietu } from '$lib/domena/pakiety';

	const db = produkty as unknown as Produkty;

	interface Pakiet {
		slug: string;
		nazwa: string;
		jedno_zdanie: string;
		dla_kogo?: string;
		kto_moze_skorzystac?: string;
		skladka?: number;
		warianty_skladka?: number[];
		warianty_skladka_5podgrup?: number[];
		warianty_skladka_3podgrupy?: number[];
		polecamy_osobom?: string[];
		sprawdzi_sie_gdy_dzieci?: string[];
		korzysci?: string[];
		zasady?: string[];
		swiadczenia?: string[];
		moduly_ochrony?: string[];
		medycyna_precyzyjna?: string[];
		procedury_leczenia_specjalistycznego_wymienione_w_ulotce?: string[];
		konsultacje?: string[];
		kogo_obejmuje?: string[];
		limit_glowny?: string;
		zasada_limitu?: string;
		LUKA?: string;
		uwaga_kumulacja?: string;
		swiadczenia_informacyjne?: string;
		warianty?: {
			nazwa: string;
			swiadczen_rocznie?: number;
			rehabilitacja?: string;
			usg?: boolean;
			tk?: boolean;
			mr?: boolean;
		}[];
	}

	const pakiety = marketing.pakiety as Pakiet[];
	const warunki = marketing.warunki_programu as { naglowek: string; punkty: string[] };

	function cena(p: Pakiet): string | null {
		const sk = p.warianty_skladka || p.warianty_skladka_5podgrup;
		if (sk) return `${formatujZl(sk[0])} – ${formatujZl(sk[2])}`;
		if (p.skladka) return formatujZl(p.skladka);
		return null;
	}

	interface Sumy {
		wiersze: WierszPakietu[];
		skladki: [number, number, number];
		obieWersje: boolean;
	}

	/** Tabela sum ubezpieczenia z cennika dla pakietu marketingowego. */
	function sumy(p: Pakiet): Sumy | null {
		const slug = MAPA_MARKETING_CENNIK[p.slug];
		if (!slug) return null;
		const cennikowy = db.pakiety_dodatkowe.find((x) => x.slug === slug);
		if (!cennikowy) return null;
		return {
			wiersze: tabelaPakietu(db, cennikowy),
			skladki: cennikowy.skladka,
			obieWersje:
				slug.endsWith('-5') &&
				db.pakiety_dodatkowe.some((x) => x.slug === slug.replace(/-5$/, '-3'))
		};
	}

	function listy(p: Pakiet): [string, string[]][] {
		return (
			[
				['Szczególnie polecamy osobom', p.polecamy_osobom],
				['Sprawdzi się, gdy dzieci', p.sprawdzi_sie_gdy_dzieci],
				['Korzyści', p.korzysci],
				['Zasady korzystania', p.zasady],
				['Świadczenia', p.swiadczenia],
				['Moduły ochrony', p.moduly_ochrony],
				['Medycyna precyzyjna', p.medycyna_precyzyjna],
				[
					'Procedury leczenia specjalistycznego',
					p.procedury_leczenia_specjalistycznego_wymienione_w_ulotce
				],
				['Konsultacje', p.konsultacje],
				['Kogo obejmuje', p.kogo_obejmuje]
			] as [string, string[] | undefined][]
		).filter((x): x is [string, string[]] => !!x[1]?.length);
	}
</script>

<h2 class="naglowek">Pakiety dodatkowe i rozszerzenia</h2>
<p class="lead">
	Pracodawca decyduje, które rozszerzenia udostępnia; pracownik wybiera je w swojej deklaracji.
	Rozwiń pakiet, żeby zobaczyć pełny opis z ulotki.
</p>

<div class="warnbox" style="margin-bottom:20px">
	<b>{warunki.naglowek}.</b>
	{#each warunki.punkty as p (p)}
		{p}{' '}
	{/each}
</div>

{#each pakiety as p (p.slug)}
	<details class="pk">
		<summary>
			<span>
				<span class="nm">{p.nazwa}</span>
				<span class="one">{p.jedno_zdanie}</span>
			</span>
			{#if cena(p)}
				<span class="pr"><b>{cena(p)}</b>za osobę / mies.</span>
			{/if}
		</summary>
		<div class="bd">
			{#if p.dla_kogo}<p class="opis">{p.dla_kogo}</p>{/if}
			{#if p.kto_moze_skorzystac}<p class="opis">{p.kto_moze_skorzystac}</p>{/if}
			{#if p.limit_glowny}
				<div class="warnbox pelna" style="margin:0">
					<b>Limit:</b>
					{p.limit_glowny}
					{#if p.zasada_limitu}<br /><span style="font-size:12.5px">{p.zasada_limitu}</span>{/if}
				</div>
			{/if}
			{#if p.warianty_skladka_3podgrupy && p.warianty_skladka_5podgrup}
				<div class="warnbox pelna" style="margin:0">
					<b>Uwaga na podgrupy operacji.</b> Pakiet główny rozlicza operacje w <b>5 podgrupach</b>
					({formatujZl(p.warianty_skladka_5podgrup[0])}–{formatujZl(p.warianty_skladka_5podgrup[2])}).
					Wersja 3-podgrupowa ({formatujZl(p.warianty_skladka_3podgrupy[0])}–{formatujZl(
						p.warianty_skladka_3podgrupy[2]
					)}) jest z nim niezgodna.
				</div>
			{/if}
			{#if p.LUKA}
				<div class="gap pelna" style="margin:0"><b>Luka w danych</b>{p.LUKA}</div>
			{/if}
			{#if sumy(p)}
				{@const s = sumy(p)!}
				<div class="pelna">
					<h4>Świadczenia i sumy ubezpieczenia (cennik do 31.12.2026)</h4>
					<table>
						<thead>
							<tr>
								<th style="text-align:left">Świadczenie</th>
								{#each [0, 1, 2] as const as i (i)}
									<th>Wariant {RZYMSKIE[i]}<br /><small class="skl">{formatujZl(s.skladki[i])} / os. / mies.</small></th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each s.wiersze as w (w.kod)}
								<tr>
									<td>
										{w.etykieta}
										{#if w.dni}<span class="dni">(dni {w.dni})</span>{/if}
									</td>
									{#each w.wartosci as v, i (i)}
										<td class="v" class:no={v === '—'}>{v}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
					{#if s.obieWersje}
						<p class="drobne" style="margin-top:8px">
							Sumy są wspólne dla wersji 5- i 3-podgrupowej — różni się tylko składka i sposób
							rozliczania operacji.
						</p>
					{/if}
				</div>
			{/if}
			{#each listy(p) as [tytul, pozycje] (tytul)}
				<div>
					<h4>{tytul}</h4>
					<ul>
						{#each pozycje as x (x)}<li>{x}</li>{/each}
					</ul>
				</div>
			{/each}
			{#if p.warianty}
				<div class="pelna">
					<h4>Warianty MediPlanu</h4>
					<table>
						<thead>
							<tr>
								<th style="text-align:left">Wariant</th><th>Świadczeń / rok</th><th>Rehabilitacja</th>
								<th>USG</th><th>TK</th><th>MR</th>
							</tr>
						</thead>
						<tbody>
							{#each p.warianty as w (w.nazwa)}
								<tr>
									<td style="text-transform:capitalize">{w.nazwa}</td>
									<td>{w.swiadczen_rocznie ?? '—'}</td>
									<td>{w.rehabilitacja ?? '—'}</td>
									<td>{w.usg ? '✓' : '—'}</td>
									<td>{w.tk ? '✓' : '—'}</td>
									<td>{w.mr ? '✓' : '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			{#if p.uwaga_kumulacja}<p class="drobne pelna">{p.uwaga_kumulacja}</p>{/if}
			{#if p.swiadczenia_informacyjne}<p class="drobne pelna">{p.swiadczenia_informacyjne}</p>{/if}
		</div>
	</details>
{/each}

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
	.pk {
		border: 1px solid var(--line);
		margin-bottom: 14px;
	}
	.pk > summary {
		padding: 16px 20px;
		cursor: pointer;
		list-style: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}
	.pk > summary::-webkit-details-marker {
		display: none;
	}
	.pk[open] > summary {
		border-bottom: 1px solid var(--line);
		background: var(--surf2);
	}
	.nm {
		display: block;
		font-weight: 700;
		font-size: 17px;
	}
	.one {
		display: block;
		color: var(--gray);
		font-size: 13.5px;
		margin-top: 2px;
	}
	.pr {
		white-space: nowrap;
		font-size: 13px;
		color: var(--gray);
		text-align: right;
	}
	.pr b {
		display: block;
		color: var(--red);
		font-size: 16px;
		font-weight: 900;
	}
	.bd {
		padding: 20px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 26px;
	}
	.pelna {
		grid-column: span 2;
	}
	.opis {
		grid-column: span 2;
		font-size: 14.5px;
		color: var(--gray);
	}
	h4 {
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--gray);
		margin-bottom: 10px;
	}
	ul {
		list-style: none;
	}
	li {
		padding-left: 20px;
		position: relative;
		margin-bottom: 8px;
		font-size: 13.5px;
	}
	li:before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--red);
		font-weight: 700;
	}
	.drobne {
		font-size: 12.5px;
		color: #8a8a8a;
	}
	.skl {
		font-weight: 400;
		color: #9a9a9a;
		font-size: 10.5px;
		text-transform: none;
		letter-spacing: 0;
	}
	td.v {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	td.no {
		color: #cfcfcf;
	}
	.dni {
		color: #aaa;
		font-size: 11px;
	}
	@media (max-width: 900px) {
		.bd {
			grid-template-columns: 1fr;
		}
		.pelna,
		.opis {
			grid-column: span 1;
		}
	}
</style>
