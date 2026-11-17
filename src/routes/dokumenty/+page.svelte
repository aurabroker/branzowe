<script lang="ts">
	type Dokument = { nazwa: string; kod: string; plik: string };

	const owu: Dokument[] = [
		{
			nazwa: 'OWU — ERGO Życie w Biznesie',
			kod: 'EZwB 01/25',
			plik: '/dokumenty/owu-ergo-zycie-w-biznesie.pdf'
		},
		{ nazwa: 'OWU — Medi Opieka', kod: 'MA 01/25', plik: '/dokumenty/owu-medi-opieka.pdf' },
		{ nazwa: 'OWU — Global Doctors', kod: 'GD-GZ 01/25', plik: '/dokumenty/owu-global-doctors.pdf' }
	];

	const karty: Dokument[] = [
		{
			nazwa: 'Karta Produktu — ERGO Życie w Biznesie',
			kod: 'EZwB 01/25',
			plik: '/dokumenty/karta-produktu-ergo-zycie-w-biznesie.pdf'
		},
		{
			nazwa: 'Karta Produktu — Medi Opieka',
			kod: 'MA 01/25',
			plik: '/dokumenty/karta-produktu-medi-opieka.pdf'
		},
		{
			nazwa: 'Karta Produktu — Global Doctors',
			kod: 'GD-GZ 01/25',
			plik: '/dokumenty/karta-produktu-global-doctors.pdf'
		}
	];
</script>

<svelte:head>
	<title>Dokumenty — ERGO Życie w Biznesie</title>
</svelte:head>

<main class="wrap dok">
	<div class="eyebrow">Dokumenty</div>
	<h1 class="t">Ogólne Warunki Ubezpieczenia i Karty Produktu</h1>
	<p class="lead">
		Wiążące warunki ubezpieczenia określają wyłącznie Ogólne Warunki Ubezpieczenia. Karty Produktu
		są materiałem informacyjnym. Pobierz dokumenty w formacie PDF.
	</p>

	<h2>Ogólne Warunki Ubezpieczenia (OWU)</h2>
	<ul class="lista">
		{#each owu as d (d.plik)}
			<li>
				<a href={d.plik} target="_blank" rel="noopener">
					<span class="ic">PDF</span>
					<span class="txt">
						<strong>{d.nazwa}</strong>
						<small>{d.kod}</small>
					</span>
				</a>
			</li>
		{/each}
	</ul>

	<h2>Karty Produktu</h2>
	<ul class="lista">
		{#each karty as d (d.plik)}
			<li>
				<a href={d.plik} target="_blank" rel="noopener">
					<span class="ic">PDF</span>
					<span class="txt">
						<strong>{d.nazwa}</strong>
						<small>{d.kod}</small>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.dok {
		padding: 48px 24px 80px;
		max-width: 780px;
	}
	.dok h1.t {
		font-size: 30px;
		font-weight: 900;
		letter-spacing: -0.6px;
	}
	.dok .lead {
		margin-top: 12px;
		color: var(--gray);
		line-height: 1.65;
	}
	.dok h2 {
		font-size: 18px;
		font-weight: 700;
		margin-top: 34px;
	}
	.lista {
		list-style: none;
		margin: 14px 0 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.lista a {
		display: flex;
		align-items: center;
		gap: 14px;
		border: 1px solid var(--line);
		padding: 14px 16px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s;
	}
	.lista a:hover {
		border-color: var(--red);
	}
	.ic {
		flex: 0 0 44px;
		width: 44px;
		height: 44px;
		background: var(--red);
		color: #fff;
		display: grid;
		place-items: center;
		font-weight: 900;
		font-size: 12px;
	}
	.txt strong {
		display: block;
		font-size: 15px;
	}
	.txt small {
		color: var(--gray);
		font-size: 12.5px;
	}
</style>
