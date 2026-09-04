<script lang="ts">
	import { OBRAZY } from '$lib/obrazy';
	import { RZYMSKIE } from '$lib/domena/skladka';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const doWniosku = $derived(`/wniosek?branza=${data.slug}`);
</script>

<svelte:head>
	<title>{data.seo_tytul}</title>
	<meta name="description" content={data.seo_opis} />
	<link rel="canonical" href="https://ergo.auraexpert.pl/branza/{data.slug}" />
	<meta property="og:title" content={data.seo_tytul} />
	<meta property="og:description" content={data.seo_opis} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="hero">
	<img src={OBRAZY[data.slug]} alt="" />
	<div class="wrap">
		<div class="cap">Program branżowy dla firm <b>2–100 osób</b></div>
		<h1>{data.naglowek}</h1>
		<p>{data.lead}</p>
		<div class="rule"></div>
		<div class="facts">
			<div class="fact"><b>od {data.skladkaOd}</b><span>za osobę / miesiąc</span></div>
			<div class="fact"><b>3</b><span>warianty do wyboru</span></div>
			<div class="fact"><b>{data.warunki.wiek_pracownika_min}–{data.warunki.wiek_pracownika_max}</b><span>wiek pracownika</span></div>
			<div class="fact"><b>24 h</b><span>ochrona na całym świecie</span></div>
		</div>
		<div class="cta-hero">
			<a class="btn" href={doWniosku}>Policz składkę dla swojej firmy</a>
			<a class="btn ghost" style="color:#fff;border-color:#666" href="/zakres-ochrony/pakiety">
				Zobacz pełny zakres ochrony
			</a>
		</div>
	</div>
</div>

<main class="wrap" style="padding:56px 24px 80px">
	<section>
		<div class="eyebrow">Dla kogo</div>
		<h2 class="t">{data.opis}</h2>
		<p class="sub">
			Program obejmuje firmy z tej branży zatrudniające od {data.warunki.zatrudnienie_min} do
			{data.warunki.zatrudnienie_max} osób. Ochroną można objąć także małżonka albo partnera oraz pełnoletnie
			dziecko pracownika.
		</p>
		<ul class="kogo">
			{#each data.kogo as k (k)}
				<li>{k}</li>
			{/each}
		</ul>
	</section>

	{#if data.scenariusze.length}
		<section class="sek">
			<div class="eyebrow">Co realnie się wypłaca</div>
			<h2 class="t">Trzy sytuacje z tej branży</h2>
			<p class="sub">
				Kwoty pochodzą z tabeli świadczeń dla branży {data.nazwa.toLowerCase()}, Wariant I. W pozostałych
				wariantach są inne — porównanie znajdziesz w tabeli niżej.
			</p>
			<div class="karty">
				{#each data.scenariusze as s (s.tytul)}
					<article class="karta">
						<h3>{s.tytul}</h3>
						<p>{s.opis}</p>
						<div class="kwota">
							<b>{s.kwota}</b>
							<small>{s.etykieta}</small>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	<section class="sek">
		<div class="eyebrow">Warianty</div>
		<h2 class="t">Trzy warianty, jedna składka miesięczna</h2>
		<p class="sub">
			Składkę płaci firma za każdą ubezpieczoną osobę. Poniżej kluczowe pozycje tabeli świadczeń;
			pełny katalog liczy ponad sto pozycji i jest dostępny w zakresie ochrony.
		</p>

		{#if data.niemonotoniczne}
			<div class="warnbox red">
				<b>Uwaga przy porównywaniu:</b> w tej branży warianty nie układają się rosnąco. Wariant III ma
				wyższe sumy na zgon niż Wariant I, mimo innej składki. Porównuj wiersz po wierszu, a nie po numerze
				wariantu.
			</div>
		{/if}

		<div class="tabela">
			<table>
				<thead>
					<tr>
						<th>Świadczenie</th>
						{#each RZYMSKIE as r, i (r)}
							<th>Wariant {r}<br /><span class="cena">{data.skladki[i]} / mies.</span></th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.wiersze as w (w.etykieta)}
						<tr>
							<td>
								{w.etykieta}
								{#if w.karencja && w.karencja !== 'brak'}
									<span class="kar">karencja {w.karencja}</span>
								{/if}
							</td>
							{#each w.wartosci as v, i (i)}
								<td class="v" class:no={v === '—'}>{v}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="drobne">
			Kwoty w osobnych wierszach nie kumulują się — wartość przy zdarzeniu szczególnym zawiera już
			świadczenie podstawowe. Operacja rozliczana jest w pięciu podgrupach; podana kwota dotyczy
			podgrupy najwyższej.
		</p>
	</section>

	<section class="sek">
		<div class="eyebrow">Warunki programu</div>
		<h2 class="t">Kiedy program działa</h2>
		<ul class="warunki">
			<li>Zatrudnienie od {data.warunki.zatrudnienie_min} do {data.warunki.zatrudnienie_max} osób. Poniżej i powyżej tego progu program nie obowiązuje.</li>
			<li>Wiek pracownika od {data.warunki.wiek_pracownika_min} do {data.warunki.wiek_pracownika_max} lat.</li>
			<li>Ochroną można objąć bliskich: {data.warunki.bliscy.join(', ')}.</li>
			<li>Oferta dla nowych klientów Sopockiego TU na Życie ERGO Hestia S.A.</li>
			<li>Ochrona całodobowa na całym świecie; świadczenia MediOpieka realizowane wyłącznie w Polsce.</li>
			<li>Składki branżowe obowiązują dla umów zawartych od {data.obowiazuje.od} do {data.obowiazuje.do}.</li>
		</ul>
	</section>

	<section class="konwersja">
		<div>
			<h2 class="t">Policz składkę dla swojej firmy</h2>
			<p class="sub">
				Kreator prowadzi przez sześć kroków i kończy się złożeniem wniosku. Numery PESEL pracowników
				są przeliczane wyłącznie w Twojej przeglądarce i nigdy nie trafiają na serwer.
			</p>
		</div>
		<a class="btn" href={doWniosku}>Przejdź do kreatora</a>
	</section>

	<div class="note">
		<b>Nie ma Twojej branży?</b> Oferta branżowa obejmuje wybrane kody PKD. Dla pozostałych firm
		przygotujemy ofertę standardową — napisz na
		<a href="mailto:zgloszenie@auraexpert.pl">zgloszenie@auraexpert.pl</a>.
	</div>
</main>

<style>
	.cta-hero {
		margin-top: 36px;
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.sek {
		margin-top: 64px;
	}
	.kogo {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 22px;
	}
	.kogo li {
		border: 1px solid var(--line);
		background: var(--surf2);
		padding: 8px 16px;
		font-size: 14px;
	}
	.karty {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-top: 28px;
	}
	.karta {
		border: 1px solid var(--line);
		border-top: 3px solid var(--red);
		padding: 22px 20px 20px;
		display: flex;
		flex-direction: column;
	}
	.karta h3 {
		font-size: 17px;
		font-weight: 700;
	}
	.karta p {
		color: var(--gray);
		font-size: 14px;
		margin-top: 8px;
		flex: 1;
	}
	.kwota {
		margin-top: 18px;
		padding-top: 14px;
		border-top: 1px solid var(--line);
	}
	.kwota b {
		display: block;
		font-size: 25px;
		font-weight: 900;
		color: var(--red);
		font-variant-numeric: tabular-nums;
	}
	.kwota small {
		display: block;
		font-size: 11.5px;
		color: #8a8a8a;
		margin-top: 3px;
	}
	.tabela {
		margin-top: 24px;
		border: 1px solid var(--line);
		overflow-x: auto;
	}
	.tabela th .cena {
		display: block;
		font-size: 12px;
		text-transform: none;
		letter-spacing: 0;
		color: var(--red);
		font-weight: 700;
		margin-top: 3px;
	}
	.kar {
		display: block;
		font-size: 11px;
		color: #9a9a9a;
	}
	.drobne {
		margin-top: 14px;
		font-size: 12px;
		color: #8a8a8a;
		max-width: 80ch;
	}
	.warunki {
		margin-top: 20px;
		padding-left: 20px;
		max-width: 78ch;
		color: var(--gray);
	}
	.warunki li {
		margin-bottom: 8px;
	}
	.konwersja {
		margin-top: 64px;
		background: var(--surf2);
		border: 1px solid var(--line);
		padding: 34px 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 28px;
	}
	.konwersja .btn {
		flex-shrink: 0;
	}
	@media (max-width: 900px) {
		.karty {
			grid-template-columns: 1fr;
		}
		.konwersja {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
