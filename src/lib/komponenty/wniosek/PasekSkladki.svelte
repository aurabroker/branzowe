<script lang="ts">
	import { stan } from './stan.svelte';
	import { formatujZl, RZYMSKIE } from '$lib/domena/skladka';

	let rozbite = $state(false);

	const widoczny = $derived(!!stan.branza && stan.krok >= 2 && stan.krok <= 6);
	const w = $derived(stan.wyliczenie);
	const n = $derived(stan.liczbaOsob);
</script>

{#if widoczny && w}
	<div class="bd2" class:on={rozbite}>
		<div class="wrap">
			<div class="r bialy"><span><b>Pakiet główny</b> — obowiązuje całą grupę, koszt pewny</span></div>
			<div class="r">
				<span>{stan.branzaObj?.nazwa} · Wariant {RZYMSKIE[stan.wariant]} × {n} os.</span>
				<b>{formatujZl(w.min)} / mies.</b>
			</div>
			{#if w.opcje.length}
				<div class="r bialy sep"><span><b>Rozszerzenia</b> — wybiera pracownik, płacisz Ty</span></div>
				{#each w.opcje as o (o.nazwa)}
					<div class="r">
						<span>{o.nazwa}</span>
						<b>{formatujZl(o.skladka)} / os. · {formatujZl(o.skladka * n)} gdyby wzięli wszyscy</b>
					</div>
				{/each}
				<div class="r bialy sep">
					<span>Przy założeniu <b>{Math.round(stan.adopcja * 100)}%</b> adopcji</span>
					<b>{formatujZl(w.szacunek)} / mies. · {formatujZl(w.szacunek * 12)} / rok</b>
				</div>
				<div class="r">
					<span>Widełki: od zera do pełnej adopcji</span>
					<b>{formatujZl(w.min)} – {formatujZl(w.max)} / mies.</b>
				</div>
			{:else}
				<div class="r sep">
					<span>Nie udostępniasz rozszerzeń — koszt jest pewny: {formatujZl(w.min * 12)} / rok.</span>
				</div>
			{/if}
		</div>
	</div>
	<div class="bar on">
		<div class="wrap">
			<div class="l">
				<div class="m">
					<span>Pakiet główny / os. · gwarantowana</span>
					<b>{formatujZl(w.baza)} <em>/ mies.</em></b>
				</div>
				<div class="m hi">
					<span>Szacowany koszt firmy / mies.</span>
					{#if n}
						<b>{formatujZl(w.szacunek)} <em>· {n} os.</em></b>
					{:else}
						<b><em style="font-size:15px">podaj strukturę</em></b>
					{/if}
				</div>
				<div class="m">
					<span>Widełki (0–100% adopcji)</span>
					{#if !n}
						<b>—</b>
					{:else if w.sumaOpcji}
						<b>{formatujZl(w.min)} – {formatujZl(w.max)}</b>
					{:else}
						<b><em style="font-size:15px">bez rozszerzeń</em></b>
					{/if}
				</div>
			</div>
			<button class="br" onclick={() => (rozbite = !rozbite)}>
				{rozbite ? 'zwiń ▴' : 'rozbij składkę ▾'}
			</button>
		</div>
	</div>
{/if}

<style>
	.bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--ink);
		color: #fff;
		z-index: 50;
	}
	.bar .wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding-top: 14px;
		padding-bottom: 14px;
		flex-wrap: wrap;
	}
	.l {
		display: flex;
		gap: 34px;
		align-items: center;
		flex-wrap: wrap;
	}
	.m span {
		display: block;
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		color: #9c9c9c;
	}
	.m b {
		font-size: 23px;
		font-weight: 900;
		letter-spacing: -0.5px;
	}
	.m b em {
		font-style: normal;
		font-size: 13px;
		font-weight: 400;
		color: #b5b5b5;
	}
	.m.hi b {
		color: #ff6b7a;
	}
	.br {
		background: 0;
		border: 0;
		color: #b5b5b5;
		font-size: 11.5px;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
	}
	.bd2 {
		position: fixed;
		bottom: 64px;
		left: 0;
		right: 0;
		max-height: 0;
		overflow: hidden;
		transition: 0.3s;
		background: #252525;
		color: #d5d5d5;
		z-index: 49;
	}
	.bd2.on {
		max-height: 340px;
		overflow: auto;
	}
	.bd2 .wrap {
		padding: 16px 24px;
	}
	.bd2 .r {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		padding: 5px 0;
	}
	.bd2 .r b {
		color: #fff;
	}
	.bd2 .r.bialy span {
		color: #fff;
	}
	.bd2 .r.sep {
		border-top: 1px solid #444;
		margin-top: 10px;
		padding-top: 12px;
	}
	@media (max-width: 900px) {
		.l {
			gap: 18px;
		}
		.m b {
			font-size: 19px;
		}
		.bd2 {
			bottom: 110px;
		}
	}
</style>
