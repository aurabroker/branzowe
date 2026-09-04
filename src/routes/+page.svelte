<script lang="ts">
	import produkty from '$lib/dane/produkty.json';
	import { OBRAZY } from '$lib/obrazy';
	import { formatujZl } from '$lib/domena/skladka';

	const liczbaSwiadczen = Object.keys(produkty.swiadczenia).length;
	const najnizsza = Math.min(...produkty.branze.flatMap((b) => b.skladka));
</script>

<svelte:head>
	<title>ERGO Życie w Biznesie — branżowe ubezpieczenie grupowe 2–100 osób</title>
	<meta
		name="description"
		content="Grupowe ubezpieczenie na życie dla firm 2–100 osób. 8 programów branżowych, składka od {najnizsza} zł. Sprawdź warunki dla swojej branży i złóż wniosek online."
	/>
</svelte:head>

<div class="hero">
	<img src={OBRAZY.hero} alt="" />
	<div class="wrap">
		<div class="cap">Program dla firm zatrudniających <b>od 2 do 100 osób</b></div>
		<h1>Ochrona wpisana w <em>życie firmy</em></h1>
		<p>
			Wybierz branżę — pokażemy wyłącznie te warunki, które Twoja firma może dostać. Bez kalkulatora
			ogólnego, bez „skontaktuj się po wycenę”.
		</p>
		<div class="rule"></div>
		<div class="facts">
			<div class="fact"><b>2–100</b><span>osób w firmie</span></div>
			<div class="fact"><b>{produkty.branze.length}</b><span>programów branżowych</span></div>
			<div class="fact"><b>{liczbaSwiadczen}</b><span>świadczeń w katalogu</span></div>
			<div class="fact"><b>od {formatujZl(najnizsza)}</b><span>za osobę / miesiąc</span></div>
			<div class="fact"><b>1 dzień</b><span>do wypłaty świadczenia</span></div>
		</div>
		<div style="margin-top:36px;display:flex;gap:12px;flex-wrap:wrap">
			<a class="btn" href="/wniosek">Złóż wniosek — wybierz branżę</a>
			<a class="btn ghost" style="color:#fff;border-color:#666" href="/zakres-ochrony/pakiety"
				>Przejrzyj zakres ochrony</a
			>
		</div>
	</div>
</div>

<main class="wrap" style="padding:56px 24px 80px">
	<div class="eyebrow">Programy branżowe</div>
	<h2 class="t">Osiem branż, osiem cenników</h2>
	<p class="sub">
		Składki i zakres różnią się między branżami — to nie jest jeden cennik z rabatem. Każda branża ma
		trzy warianty z innym rozkładem sum ubezpieczenia. Wejdź w swoją, żeby zobaczyć tabelę świadczeń
		i policzyć składkę.
	</p>
	<div class="siatka">
		{#each produkty.branze as b (b.slug)}
			<a class="kafel" href="/branza/{b.slug}">
				<span class="ph"><img src={OBRAZY[b.slug]} alt={b.nazwa} loading="lazy" /></span>
				<span class="tresc">
					<strong>{b.nazwa}</strong>
					<small>{b.opis}</small>
					<span class="px">od <b>{formatujZl(Math.min(...b.skladka))}</b> / os. / mies.</span>
				</span>
			</a>
		{/each}
	</div>
	<div class="note">
		<b>Nie ma Twojej branży?</b> Oferta branżowa obejmuje wybrane kody PKD. Dla pozostałych firm
		przygotujemy ofertę standardową — napisz na
		<a href="mailto:zgloszenie@auraexpert.pl">zgloszenie@auraexpert.pl</a>.
	</div>
</main>

<style>
	.siatka {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-top: 28px;
	}
	.kafel {
		border: 1px solid var(--line);
		background: #fff;
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: 0.18s;
		display: block;
	}
	.kafel:hover {
		border-color: var(--red);
		transform: translateY(-3px);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.09);
	}
	.ph {
		display: block;
		aspect-ratio: 4/3;
		overflow: hidden;
		background: var(--surf);
	}
	.ph img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: 0.4s;
	}
	.kafel:hover .ph img {
		transform: scale(1.05);
	}
	.tresc {
		display: block;
		padding: 14px 14px 16px;
	}
	.tresc strong {
		display: block;
		font-size: 15px;
		font-weight: 700;
	}
	.tresc small {
		display: block;
		color: #8a8a8a;
		font-size: 12px;
		margin-top: 3px;
		line-height: 1.35;
		min-height: 32px;
	}
	.px {
		display: block;
		margin-top: 10px;
		font-size: 12px;
		color: var(--gray);
		border-top: 1px solid var(--line);
		padding-top: 9px;
	}
	.px b {
		color: var(--red);
		font-weight: 700;
		font-size: 15px;
	}
	@media (max-width: 900px) {
		.siatka {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
