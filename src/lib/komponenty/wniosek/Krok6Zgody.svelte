<script lang="ts">
	import { goto } from '$app/navigation';
	import { stan } from './stan.svelte';
	import { formatujZl, RZYMSKIE } from '$lib/domena/skladka';
	import { ZGODY, KODY_WYMAGANE } from '$lib/domena/zgody';

	let otwarte = $state<Record<string, boolean>>({});

	const w = $derived(stan.wyliczenie!);
	const zgodyOk = $derived(KODY_WYMAGANE.every((k) => stan.zgody[k]));

	async function wyslij() {
		if (!zgodyOk || stan.wysylka.stan === 'trwa') return;
		stan.wysylka = { stan: 'trwa' };
		try {
			const odp = await fetch('/api/wnioski', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					branza: stan.branza,
					wariant: stan.wariant,
					rozszerzenia: { medi: stan.medi, gd: stan.gd, pakiety: stan.pakiety },
					zalozona_adopcja: stan.adopcja,
					liczba_osob: stan.liczbaOsob,
					struktura: stan.struktura,
					firma: stan.gus,
					kontakt: stan.kontakt,
					zgody: Object.fromEntries(
						ZGODY.filter((z) => stan.zgody[z.kod]).map((z) => [z.kod, { wersja: z.wersja }])
					),
					skladka_klienta: { min: w.min, max: w.max, szacunek: w.szacunek }
				})
			});
			if (!odp.ok) {
				const tekst = await odp.text();
				throw new Error(`${odp.status}: ${tekst.slice(0, 200)}`);
			}
			const { nr_wniosku } = (await odp.json()) as { nr_wniosku: string };
			const email = stan.kontakt.email;
			const kompletny = !!stan.struktura;
			stan.wyczysc();
			await goto(
				`/wniosek/dziekujemy?nr=${encodeURIComponent(nr_wniosku)}&email=${encodeURIComponent(email)}&kompletny=${kompletny ? 1 : 0}`
			);
		} catch (e) {
			stan.wysylka = { stan: 'blad', blad: e instanceof Error ? e.message : 'nieznany błąd' };
		}
	}
</script>

<div class="eyebrow">Krok 6</div>
<h2 class="t">Podsumowanie i zgody</h2>

<div class="sumcard">
	<h4>Twój wniosek</h4>
	<div class="r"><span>Firma</span><b>{stan.gus?.nazwa ?? '—'}</b></div>
	<div class="r"><span>NIP</span><b>{stan.gus?.nip ?? '—'}</b></div>
	<div class="r"><span>Program</span><b>{stan.branzaObj?.nazwa} · Wariant {RZYMSKIE[stan.wariant]}</b></div>
	<div class="r"><span>Osób do ubezpieczenia</span><b>{stan.liczbaOsob}</b></div>
	<div class="r">
		<span>Struktura rocznik × płeć</span>
		<b>{stan.struktura ? `${stan.struktura.length} pozycji (bez danych osobowych)` : 'arkusz mailem'}</b>
	</div>
	<div class="r"><span>Pakiet główny</span><b>{formatujZl(w.baza)} / os. / mies.</b></div>
	<div class="r tot"><span>Koszt pewny</span><span>{formatujZl(w.min)} / mies.</span></div>

	<h4 style="margin-top:26px">Rozszerzenia udostępnione zespołowi</h4>
	{#if w.opcje.length}
		{#each w.opcje as o (o.nazwa)}
			<div class="r"><span>{o.nazwa}</span><b>{formatujZl(o.skladka)} / os.</b></div>
		{/each}
		<div class="r">
			<span>Przy {Math.round(stan.adopcja * 100)}% adopcji</span>
			<b>≈ {formatujZl(w.szacunek)} / mies.</b>
		</div>
		<div class="r tot"><span>Widełki kosztu</span><span>{formatujZl(w.min)} – {formatujZl(w.max)}</span></div>
		<p style="font-size:12px;color:var(--gray);margin-top:10px">
			Ostateczna składka wyjdzie <b>po zebraniu deklaracji</b> od pracowników — każdy sam wskaże,
			które rozszerzenia bierze. Opiekun potwierdzi kwotę przed wystawieniem polisy.
		</p>
	{:else}
		<p style="font-size:13px;color:var(--gray)">
			Nie udostępniasz rozszerzeń — składka jest z góry znana i nie zmieni się po zebraniu deklaracji.
		</p>
	{/if}
</div>

<div class="cons">
	{#each ZGODY as z (z.kod)}
		<div class="crow" class:open={otwarte[z.kod]}>
			<input
				type="checkbox"
				id={z.kod}
				checked={!!stan.zgody[z.kod]}
				onchange={(e) => {
					stan.zgody = { ...stan.zgody, [z.kod]: e.currentTarget.checked };
					stan.zapisz();
				}}
			/>
			<div class="tx">
				<label for={z.kod}>
					{z.etykieta}
					{#if z.wymagana}<i>*</i>{:else}<span style="color:#9A9A9A">(dobrowolna)</span>{/if}
				</label>
				<button onclick={() => (otwarte = { ...otwarte, [z.kod]: !otwarte[z.kod] })}>
					czytaj całość
				</button>
				<p>{z.tresc}</p>
			</div>
		</div>
	{/each}
	<p style="font-size:12px;color:var(--gray);margin-top:14px">
		<i style="font-style:normal;color:var(--red)">*</i> zgody wymagane do złożenia wniosku
	</p>
</div>

{#if stan.wysylka.stan === 'blad'}
	<div class="warnbox red">
		<b>Nie udało się wysłać wniosku.</b> Spróbuj ponownie za chwilę. ({stan.wysylka.blad})
	</div>
{/if}

<div class="nav-krok">
	<button class="btn ghost" onclick={() => stan.idz(5)}>← Wstecz</button>
	<button class="btn" disabled={!zgodyOk || stan.wysylka.stan === 'trwa'} onclick={wyslij}>
		{stan.wysylka.stan === 'trwa' ? 'Wysyłam…' : 'Złóż wniosek'}
	</button>
</div>

<style>
	.sumcard {
		border: 1px solid var(--line);
		padding: 22px;
		background: var(--surf2);
		max-width: 820px;
		margin-top: 24px;
	}
	.sumcard h4 {
		font-size: 12px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--gray);
		margin-bottom: 14px;
	}
	.r {
		display: flex;
		justify-content: space-between;
		padding: 7px 0;
		font-size: 14px;
		border-bottom: 1px dotted #e0e0e0;
	}
	.r.tot {
		border: 0;
		border-top: 2px solid var(--ink);
		margin-top: 8px;
		padding-top: 12px;
		font-size: 19px;
		font-weight: 900;
	}
	.cons {
		max-width: 820px;
		margin-top: 24px;
	}
	.crow {
		display: flex;
		gap: 12px;
		padding: 14px 0;
		border-bottom: 1px solid #efefef;
		align-items: flex-start;
	}
	.crow input {
		margin-top: 3px;
		width: 17px;
		height: 17px;
		accent-color: var(--red);
		flex: 0 0 17px;
	}
	.tx {
		flex: 1;
		font-size: 13.5px;
	}
	.tx i {
		font-style: normal;
		color: var(--red);
	}
	.tx button {
		background: 0;
		border: 0;
		color: var(--red);
		font-size: 12px;
		cursor: pointer;
		text-decoration: underline;
		padding: 4px 0 0;
	}
	.tx p {
		display: none;
		margin-top: 8px;
		font-size: 12.5px;
		color: var(--gray);
		background: var(--surf2);
		padding: 12px;
		line-height: 1.55;
	}
	.crow.open .tx p {
		display: block;
	}
</style>
