<script lang="ts">
	import { page } from '$app/state';

	const nr = $derived(page.url.searchParams.get('nr') ?? '');
	const email = $derived(page.url.searchParams.get('email') ?? 'twój adres e-mail');
	const kompletny = $derived(page.url.searchParams.get('kompletny') === '1');
</script>

<svelte:head>
	<title>Wniosek przyjęty — ERGO Życie w Biznesie</title>
</svelte:head>

<main class="wrap">
	<div class="done">
		<div class="ic">✓</div>
		<h2>Wniosek przyjęty</h2>
		<p>
			Numer <b>{nr}</b>. Kopia oferty poszła na <b>{email}</b>. Opiekun odezwie się w ciągu jednego
			dnia roboczego.
		</p>

		{#if kompletny}
			<div class="komplet">
				<strong>Wniosek jest kompletny.</strong>
				<small>
					Strukturę wiekową już mamy — nie musisz nic odsyłać. Opiekun potwierdzi warunki i
					przygotuje polisę.
				</small>
			</div>
		{:else}
			<div class="xls">
				<div class="ix">XLS</div>
				<div>
					<strong>lista-ubezpieczonych.xlsx</strong>
					<small>
						Arkusz zgłoszeniowy ERGO Hestii dostaniesz w mailu z potwierdzeniem. Wypełnij dane osób
						przystępujących i odeślij — każdy pracownik składa własną deklarację z wyborem
						rozszerzeń, dopiero wtedy znamy ostateczną składkę.
					</small>
				</div>
			</div>
		{/if}

		<div style="margin-top:32px"><a class="btn ghost" href="/wniosek">Zacznij od nowa</a></div>
	</div>
</main>

<style>
	.done {
		text-align: center;
		padding: 60px 0;
	}
	.ic {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: #e7f5ec;
		color: var(--ok);
		display: grid;
		place-items: center;
		margin: 0 auto 22px;
		font-size: 32px;
	}
	.done h2 {
		font-size: 32px;
		font-weight: 900;
	}
	.done > p {
		color: var(--gray);
		max-width: 56ch;
		margin: 12px auto 0;
	}
	.xls {
		max-width: 560px;
		margin: 32px auto 0;
		border: 1px solid var(--line);
		padding: 18px;
		display: flex;
		gap: 14px;
		align-items: center;
		text-align: left;
	}
	.ix {
		width: 44px;
		height: 44px;
		background: #1d6f42;
		color: #fff;
		display: grid;
		place-items: center;
		font-weight: 900;
		font-size: 12px;
		flex: 0 0 44px;
	}
	.xls strong {
		display: block;
		font-size: 14px;
	}
	.xls small,
	.komplet small {
		color: var(--gray);
		font-size: 12.5px;
	}
	.komplet {
		max-width: 560px;
		margin: 32px auto 0;
		border: 1px solid var(--line);
		border-left: 3px solid var(--ok);
		padding: 18px;
		text-align: left;
	}
	.komplet strong {
		display: block;
		font-size: 14px;
	}
</style>
