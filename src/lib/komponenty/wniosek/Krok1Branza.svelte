<script lang="ts">
	import { stan, DB } from './stan.svelte';
	import { OBRAZY } from '$lib/obrazy';
	import { formatujZl } from '$lib/domena/skladka';

	function wybierz(slug: string) {
		stan.branza = slug;
		stan.wariant = 0;
		stan.pakiety = {};
		setTimeout(() => stan.idz(2), 140);
	}
</script>

<div class="eyebrow">Krok 1</div>
<h2 class="t">Jaka to branża?</h2>
<p class="sub">
	Składki i zakres różnią się między branżami — to nie jest jeden cennik z rabatem. Wybierz swoją, a
	zobaczysz dokładnie te trzy warianty, które ERGO Hestia oferuje firmom z Twoim PKD.
</p>
<div class="warnbox red" style="margin-top:18px">
	<b>Zanim wybierzesz branżę:</b> program działa wyłącznie dla firm zatrudniających
	<b>od 2 do 100 osób</b>, w wieku 15–70 lat. Poniżej i powyżej tego progu opiekun przygotuje ofertę
	indywidualną.
</div>

<div class="tiles">
	{#each DB.branze as b (b.slug)}
		<button class="tile" class:sel={stan.branza === b.slug} onclick={() => wybierz(b.slug)}>
			<span class="ph"><img src={OBRAZY[b.slug]} alt="" loading="lazy" /></span>
			<span class="b">
				<strong>{b.nazwa}</strong><small>{b.opis}</small>
				<span class="px">od <b>{formatujZl(Math.min(...b.skladka))}</b> / os. / mies.</span>
			</span>
		</button>
	{/each}
</div>

<div class="note">
	<b>Nie ma Twojej branży?</b> Oferta branżowa obejmuje wybrane kody PKD. Dla pozostałych firm
	przygotujemy ofertę standardową —
	<a href="mailto:biuro@utratadochodu.com">zostaw kontakt</a>.
</div>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-top: 28px;
	}
	.tile {
		border: 1px solid var(--line);
		background: #fff;
		cursor: pointer;
		text-align: left;
		padding: 0;
		overflow: hidden;
		transition: 0.18s;
		position: relative;
	}
	.tile:hover {
		border-color: var(--red);
		transform: translateY(-3px);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.09);
	}
	.tile.sel {
		border-color: var(--red);
		box-shadow: 0 0 0 2px var(--red) inset;
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
	.tile:hover .ph img {
		transform: scale(1.05);
	}
	.b {
		display: block;
		padding: 14px 14px 16px;
	}
	.b strong {
		display: block;
		font-size: 15px;
		font-weight: 700;
	}
	.b small {
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
		.tiles {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
