<script lang="ts">
	import { stan, type DaneGus } from './stan.svelte';
	import { nipPoprawny, czystyNip } from '$lib/domena/nip';

	let nip = $state(stan.gus?.nip ?? '');
	let nipZly = $state(false);
	let szukam = $state(false);
	let wynik = $state<'brak' | 'ok' | 'nie-znaleziono' | 'awaria'>(stan.gus ? 'ok' : 'brak');
	let trybReczny = $state(stan.gus?.zrodlo === 'recznie');
	let nazwaReczna = $state(stan.gus?.zrodlo === 'recznie' ? stan.gus.nazwa : '');

	const pokazReszte = $derived(wynik === 'ok' || trybReczny);
	const kontaktOk = $derived(
		stan.kontakt.imie.trim().length > 2 &&
			/.+@.+\..+/.test(stan.kontakt.email) &&
			czystyNip(stan.kontakt.telefon).length >= 9
	);
	const dalejOk = $derived(pokazReszte && kontaktOk && (!trybReczny || nazwaReczna.trim().length > 2));

	async function sprawdz() {
		nipZly = !nipPoprawny(nip);
		if (nipZly) {
			wynik = 'brak';
			stan.gus = null;
			return;
		}
		szukam = true;
		trybReczny = false;
		try {
			const odp = await fetch(`/api/gus?nip=${czystyNip(nip)}`);
			if (odp.status === 404) {
				wynik = 'nie-znaleziono';
				stan.gus = null;
			} else if (!odp.ok) {
				wynik = 'awaria';
				stan.gus = null;
			} else {
				const dane = (await odp.json()) as Omit<DaneGus, 'zrodlo'>;
				stan.gus = { ...dane, nip: czystyNip(nip), zrodlo: 'gus' };
				wynik = 'ok';
			}
		} catch {
			wynik = 'awaria';
			stan.gus = null;
		} finally {
			szukam = false;
			stan.zapisz();
		}
	}

	function recznie() {
		trybReczny = true;
		wynik = 'brak';
	}

	function zapiszReczne() {
		stan.gus = { nip: czystyNip(nip), nazwa: nazwaReczna.trim(), zrodlo: 'recznie' };
		stan.zapisz();
	}

	const za100 = $derived(
		stan.gus?.klasa_wielkosci ? /250|1000|\+/.test(stan.gus.klasa_wielkosci) : false
	);
</script>

<div class="eyebrow">Krok 5</div>
<h2 class="t">Dane firmy</h2>
<p class="sub">
	Podaj NIP — resztę pobierzemy z rejestru REGON (GUS). Sprawdzimy też, czy Twoje PKD mieści się w
	wybranej branży.
</p>

<div class="form">
	<div class="f wide" class:bad={nipZly}>
		<label for="nip">NIP <i>*</i></label>
		<div class="nipRow">
			<input id="nip" maxlength="13" placeholder="np. 5252248481" autocomplete="off" bind:value={nip} />
			<button class="btn" onclick={sprawdz} disabled={szukam}>
				{szukam ? 'Odpytuję REGON…' : 'Sprawdź w GUS'}
			</button>
		</div>
		<small class="err">Nieprawidłowy NIP — suma kontrolna się nie zgadza.</small>
	</div>
</div>

{#if wynik === 'nie-znaleziono'}
	<div class="warnbox">
		<b>Nie znaleźliśmy firmy o NIP {czystyNip(nip)} w rejestrze REGON.</b> Sprawdź numer albo wpisz
		dane ręcznie.<br />
		<button class="btn ghost" style="margin-top:10px" onclick={recznie}>Wpisz dane ręcznie</button>
	</div>
{:else if wynik === 'awaria'}
	<div class="warnbox">
		<b>Rejestr REGON chwilowo nie odpowiada.</b> Nie blokujemy Cię — możesz wpisać dane ręcznie,
		zweryfikujemy je po naszej stronie.<br />
		<button class="btn ghost" style="margin-top:10px" onclick={recznie}>Wpisz dane ręcznie</button>
	</div>
{:else if wynik === 'ok' && stan.gus}
	<div class="gus">
		<div class="hd"><span>Dane z rejestru REGON (GUS)</span><span class="pill ok">Znaleziono</span></div>
		<div class="bd">
			<dl><dt>Nazwa</dt><dd>{stan.gus.nazwa}</dd></dl>
			<dl><dt>NIP / REGON</dt><dd>{stan.gus.nip}{stan.gus.regon ? ` / ${stan.gus.regon}` : ''}</dd></dl>
			{#if stan.gus.adres}<dl><dt>Adres</dt><dd>{stan.gus.adres}</dd></dl>{/if}
			{#if stan.gus.pkd_kod}
				<dl>
					<dt>PKD przeważające</dt>
					<dd>
						{stan.gus.pkd_kod}<br />
						<span style="font-weight:400;font-size:12.5px;color:var(--gray)">{stan.gus.pkd_opis}</span>
					</dd>
				</dl>
			{/if}
			{#if stan.gus.forma}<dl><dt>Forma prawna</dt><dd>{stan.gus.forma}</dd></dl>{/if}
			{#if stan.gus.klasa_wielkosci}
				<dl><dt>Klasa wielkości (GUS)</dt><dd>{stan.gus.klasa_wielkosci}</dd></dl>
			{/if}
		</div>
	</div>
	{#if za100}
		<div class="warnbox">
			<b>GUS podaje klasę wielkości powyżej progu programu.</b> Program obejmuje 2–100 osób. Jeśli
			ubezpieczasz mniejszą grupę (np. jeden oddział), opiekun to potwierdzi.
		</div>
	{/if}
{/if}

{#if trybReczny}
	<div class="note">Tryb ręczny — dane zweryfikuje opiekun przed wystawieniem polisy.</div>
	<div class="form">
		<div class="f wide">
			<label for="nazwaR">Nazwa firmy <i>*</i></label>
			<input id="nazwaR" bind:value={nazwaReczna} onblur={zapiszReczne} placeholder="Pełna nazwa firmy" />
		</div>
	</div>
{/if}

{#if pokazReszte}
	<div class="form">
		<div class="f">
			<label for="imie">Osoba do kontaktu <i>*</i></label>
			<input id="imie" bind:value={stan.kontakt.imie} placeholder="Imię i nazwisko" />
		</div>
		<div class="f">
			<label for="stan">Stanowisko</label>
			<input id="stan" bind:value={stan.kontakt.stanowisko} placeholder="np. właściciel, HR" />
		</div>
		<div class="f">
			<label for="mail">E-mail <i>*</i></label>
			<input id="mail" type="email" bind:value={stan.kontakt.email} placeholder="na ten adres wyślemy potwierdzenie" />
		</div>
		<div class="f">
			<label for="tel">Telefon <i>*</i></label>
			<input id="tel" bind:value={stan.kontakt.telefon} placeholder="+48" />
		</div>
		<div class="f">
			<label for="start">Planowany start ochrony</label>
			<input id="start" type="date" bind:value={stan.kontakt.start} />
		</div>
	</div>
{/if}

<div class="nav-krok">
	<button class="btn ghost" onclick={() => stan.idz(4)}>← Wstecz</button>
	<button
		class="btn"
		disabled={!dalejOk}
		onclick={() => {
			if (trybReczny) zapiszReczne();
			stan.idz(6);
		}}
	>
		Dalej: podsumowanie →
	</button>
</div>

<style>
	.nipRow {
		display: flex;
		gap: 8px;
	}
	.nipRow input {
		flex: 1;
	}
	.gus {
		margin-top: 20px;
		border: 1px solid var(--line);
		max-width: 760px;
	}
	.gus .hd {
		background: var(--surf);
		padding: 10px 16px;
		font-size: 11px;
		letter-spacing: 1.4px;
		text-transform: uppercase;
		color: var(--gray);
		font-weight: 700;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.gus .bd {
		padding: 18px 16px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
	}
	.gus dl dt {
		font-size: 11px;
		color: #9a9a9a;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	.gus dl dd {
		font-size: 14.5px;
		font-weight: 500;
		margin-top: 2px;
	}
	@media (max-width: 900px) {
		.gus .bd {
			grid-template-columns: 1fr;
		}
	}
</style>
