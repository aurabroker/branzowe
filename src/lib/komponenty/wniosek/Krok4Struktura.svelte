<script lang="ts">
	import { stan } from './stan.svelte';
	import {
		parsujListe,
		wZakresieWieku,
		doAgregatu,
		WIEK_MIN,
		WIEK_MAX
	} from '$lib/domena/pesel';

	let tekst = $state('');
	let liczbaReczna = $state(12);

	const KUBELKI: [number, number][] = [
		[15, 24],
		[25, 34],
		[35, 44],
		[45, 54],
		[55, 70]
	];

	const zaMalo = $derived(stan.liczbaOsob > 0 && stan.liczbaOsob < 2);
	const zaDuzo = $derived(stan.liczbaOsob > 100);
	const ok = $derived(stan.liczbaOsob >= 2 && stan.liczbaOsob <= 100);

	function przelicz() {
		const { osoby, bledy } = parsujListe(tekst);
		const wZakresie = wZakresieWieku(osoby);
		const poza = osoby.length - wZakresie.length;

		if (!wZakresie.length) {
			stan.struktura = null;
			stan.statystyki = null;
			stan.liczbaOsob = 0;
			if (osoby.length || bledy.length)
				stan.statystyki = {
					kobiety: 0,
					mezczyzni: 0,
					sredniWiek: 0,
					kubelki: [],
					pozaWiekiem: poza,
					nierozpoznane: bledy
				};
			return;
		}

		stan.struktura = doAgregatu(wZakresie);
		stan.liczbaOsob = wZakresie.length;
		const k = wZakresie.filter((o) => o.plec === 'K').length;
		stan.statystyki = {
			kobiety: k,
			mezczyzni: wZakresie.length - k,
			sredniWiek: wZakresie.reduce((a, o) => a + o.wiek, 0) / wZakresie.length,
			kubelki: KUBELKI.map(([od, do_]) => ({
				od,
				do: do_,
				ile: wZakresie.filter((o) => o.wiek >= od && o.wiek <= do_).length
			})),
			pozaWiekiem: poza,
			nierozpoznane: bledy
		};
		stan.zapisz();
	}

	function demo() {
		tekst = [
			'85031255515',
			'99113012345',
			'76092399101',
			'01251500000',
			'06280200000',
			'1978 M',
			'1995 K',
			'2003-04-11 M',
			'1969 K',
			'92050612345'
		].join('\n');
	}

	function ustawTryb(t: 0 | 1) {
		stan.tryb = t;
		if (t === 1) {
			stan.struktura = null;
			stan.statystyki = null;
			stan.liczbaOsob = Math.max(0, Math.min(999, liczbaReczna));
		} else {
			stan.liczbaOsob = stan.struktura
				? stan.struktura.reduce((a, p) => a + p.liczba, 0)
				: 0;
		}
	}

	const maxKubelek = $derived(
		stan.statystyki ? Math.max(...stan.statystyki.kubelki.map((k) => k.ile), 1) : 1
	);
</script>

<div class="eyebrow">Krok 4</div>
<h2 class="t">
	Ile osób ubezpieczasz?
	<span style="font-size:15px;font-weight:400;color:var(--red);white-space:nowrap">— musi być od 2 do 100</span>
</h2>
<p class="sub">
	<b>Składka jest już ostateczna</b> i nie zależy od wieku zespołu — struktura wiekowa jest nam
	potrzebna do wystawienia polisy, nie do wyceny. Możesz podać ją teraz albo dostać arkusz mailem.
</p>

<div class="fin">
	<button class:on={stan.tryb === 0} onclick={() => ustawTryb(0)}>Mam listę — wkleję teraz</button>
	<button class:on={stan.tryb === 1} onclick={() => ustawTryb(1)}>
		Podam samą liczbę, resztę uzupełnię później
	</button>
</div>

{#if stan.tryb === 0}
	<div class="note" style="border-left-color:var(--ok)">
		<b>PESEL-e nie opuszczają tej przeglądarki.</b> Przeliczamy je lokalnie na wiek i płeć, a do nas
		trafia wyłącznie tabela zbiorcza — ile kobiet i mężczyzn w każdym roczniku. Odśwież stronę i
		znikają.
	</div>

	<div class="grid2">
		<div>
			<label class="lbl" for="paste">
				Wklej dane (jedna osoba w wierszu) — PESEL, data urodzenia + płeć albo sam rocznik + płeć
			</label>
			<textarea
				id="paste"
				rows="12"
				bind:value={tekst}
				placeholder={'85031255515\n99113012345\n2001-05-15 K\n1978 M\n…'}
			></textarea>
			<div style="display:flex;gap:8px;margin-top:10px">
				<button class="btn" onclick={przelicz}>Przelicz strukturę</button>
				<button class="btn ghost" onclick={demo}>Wklej dane demo</button>
			</div>
		</div>
		<div>
			{#if stan.statystyki && stan.liczbaOsob > 0}
				{@const s = stan.statystyki}
				<div style="border:1px solid var(--line);padding:20px">
					<div class="staty">
						<div>
							<span class="et">Osób</span>
							<b style:color={zaDuzo || zaMalo ? 'var(--red)' : 'var(--ink)'}>{stan.liczbaOsob}</b>
						</div>
						<div><span class="et">Kobiety / Mężczyźni</span><b>{s.kobiety} / {s.mezczyzni}</b></div>
						<div><span class="et">Średni wiek</span><b>{s.sredniWiek.toFixed(1)}</b></div>
					</div>
					<div style="margin-top:16px">
						{#each s.kubelki as k (k.od)}
							<div class="pasek">
								<span class="zakres">{k.od}–{k.do}</span>
								<span class="tor"><span class="slup" style:width="{(k.ile / maxKubelek) * 100}%"></span></span>
								<span class="ile">{k.ile}</span>
							</div>
						{/each}
					</div>
					<p style="font-size:11.5px;color:#9A9A9A;margin-top:14px">
						Do ERGO Hestii wysyłamy tylko te liczby — {stan.struktura?.length ?? 0} pozycji siatki
						rocznik × płeć.
					</p>
				</div>
			{:else}
				<div class="pusto">Tu pojawi się rozkład wieku<br />i liczba osób do ubezpieczenia</div>
			{/if}

			{#if zaDuzo}
				<div class="warnbox">
					<b>{stan.liczbaOsob} osób — program obejmuje maks. 100.</b> Przy większych zespołach
					opiekun przygotuje ofertę indywidualną.
				</div>
			{/if}
			{#if zaMalo}<div class="warnbox"><b>Minimum to 2 osoby.</b></div>{/if}
			{#if stan.statystyki?.pozaWiekiem}
				<div class="warnbox">
					<b>{stan.statystyki.pozaWiekiem} os. poza zakresem wieku {WIEK_MIN}–{WIEK_MAX} lat</b> —
					nie wchodzą do ubezpieczenia i nie liczymy ich do składki.
				</div>
			{/if}
			{#if stan.statystyki?.nierozpoznane.length}
				<div class="warnbox">
					<b>{stan.statystyki.nierozpoznane.length} wierszy nierozpoznanych:</b><br />
					{#each stan.statystyki.nierozpoznane.slice(0, 4) as z (z.wiersz)}
						<code>{z.wiersz.slice(0, 18)}</code> — {z.powod}<br />
					{/each}
					{#if stan.statystyki.nierozpoznane.length > 4}…{/if}
				</div>
			{/if}
			{#if stan.statystyki && stan.liczbaOsob === 0 && !stan.statystyki.nierozpoznane.length}
				<div class="warnbox">
					Nie rozpoznaliśmy żadnej osoby. Wklej PESEL-e (11 cyfr), daty
					<code>RRRR-MM-DD K/M</code> albo roczniki <code>RRRR K/M</code>.
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="form">
		<div class="f wide" style="max-width:420px">
			<label for="cntM">Liczba osób do ubezpieczenia <i>*</i></label>
			<input
				id="cntM"
				type="number"
				min="2"
				max="100"
				bind:value={liczbaReczna}
				oninput={() => (stan.liczbaOsob = Math.max(0, Math.min(999, liczbaReczna || 0)))}
			/>
			<small style="font-size:12px;color:var(--gray);margin-top:4px">
				Arkusz struktury wiekowej wyślemy mailem razem z potwierdzeniem. Polisę wystawimy, gdy go
				odeślesz — składka się nie zmieni.
			</small>
		</div>
	</div>
{/if}

<div class="nav-krok">
	<button class="btn ghost" onclick={() => stan.idz(3)}>← Wstecz</button>
	<button class="btn" disabled={!ok} onclick={() => stan.idz(5)}>Dalej: dane firmy →</button>
</div>

<style>
	.fin {
		display: flex;
		gap: 0;
		margin-top: 20px;
		border: 1px solid var(--line);
		width: fit-content;
	}
	.fin button {
		border: 0;
		background: #fff;
		padding: 9px 18px;
		font-size: 13px;
		cursor: pointer;
		color: var(--gray);
		border-right: 1px solid var(--line);
	}
	.fin button:last-child {
		border-right: 0;
	}
	.fin button.on {
		background: var(--ink);
		color: #fff;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		margin-top: 24px;
	}
	.lbl {
		font-size: 12.5px;
		font-weight: 500;
		display: block;
		margin-bottom: 6px;
	}
	textarea {
		width: 100%;
		border: 1px solid var(--line);
		padding: 12px;
		font-family: ui-monospace, monospace;
		font-size: 13px;
		resize: vertical;
	}
	.pusto {
		border: 1px dashed var(--line);
		height: 100%;
		min-height: 280px;
		display: grid;
		place-items: center;
		color: #9a9a9a;
		font-size: 13px;
		text-align: center;
		padding: 20px;
	}
	.staty {
		display: flex;
		gap: 26px;
		flex-wrap: wrap;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--line);
	}
	.et {
		display: block;
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: #9a9a9a;
	}
	.staty b {
		font-size: 28px;
		font-weight: 900;
	}
	.pasek {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 7px;
		font-size: 12px;
	}
	.zakres {
		width: 52px;
		color: var(--gray);
	}
	.tor {
		flex: 1;
		background: var(--surf);
		height: 16px;
	}
	.slup {
		display: block;
		height: 16px;
		background: var(--red);
	}
	.ile {
		width: 22px;
		text-align: right;
		font-weight: 700;
	}
	@media (max-width: 900px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
