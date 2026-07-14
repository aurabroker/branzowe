<svelte:head>
	<title>RODO — informacja o przetwarzaniu danych — ERGO Życie w Biznesie</title>
</svelte:head>

<main class="wrap prawna">
	<div class="eyebrow">RODO</div>
	<h1 class="t">Informacja o przetwarzaniu danych osobowych</h1>

	<h2>Kto przetwarza dane</h2>
	<p>
		Administratorem danych zbieranych w tym serwisie jest Aura Expert sp. z o.o. (dystrybutor
		ubezpieczeń). Po przekazaniu wniosku administratorem danych w celu zawarcia i wykonania umowy
		ubezpieczenia staje się Sopockie Towarzystwo Ubezpieczeń na Życie ERGO Hestia S.A.
	</p>

	<h2>Jakie dane zbieramy i po co</h2>
	<p>
		1. <b>Dane firmy</b> (NIP, nazwa, adres, PKD — pobierane z rejestru REGON) oraz
		<b>dane osoby kontaktowej</b> (imię i nazwisko, e-mail, telefon, stanowisko) — w celu
		przygotowania i obsługi wniosku o ubezpieczenie (art. 6 ust. 1 lit. b RODO).<br />
		2. <b>Zbiorczą strukturę wiekową zespołu</b> — wyłącznie liczbę osób danej płci w danym
		roczniku. <b>Numery PESEL nie opuszczają Twojej przeglądarki</b>: są przeliczane lokalnie na
		agregat, a nasz serwer aktywnie odrzuca każde zgłoszenie zawierające numer PESEL.<br />
		3. <b>Zgody marketingowe</b> (jeśli ich udzielono) — na podstawie art. 6 ust. 1 lit. a RODO;
		można je wycofać w każdej chwili.
	</p>

	<h2>Komu powierzamy dane</h2>
	<p>
		Dane przechowujemy w Unii Europejskiej: baza danych Supabase (region UE), wysyłka e-maili
		Resend, infrastruktura Cloudflare. Dane wniosku przekazujemy ubezpieczycielowi — ERGO Hestii.
	</p>

	<h2>Jak długo i jakie masz prawa</h2>
	<p>
		Dane wniosków przechowujemy przez okres wymagany przepisami o dystrybucji ubezpieczeń. Masz
		prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia
		oraz wniesienia skargi do Prezesa UODO. Kontakt w sprawach danych:
		<a href="mailto:zgloszenie@auraexpert.pl">zgloszenie@auraexpert.pl</a>.
	</p>

	<!-- TODO: polityka do zatwierdzenia przez prawnika/IOD przed startem kampanii -->
	<div class="note">Dokument roboczy — wymaga zatwierdzenia przez prawnika przed startem kampanii.</div>
</main>

<style>
	.prawna {
		padding: 48px 24px 80px;
		max-width: 780px;
	}
	.prawna h1.t {
		font-size: 30px;
		font-weight: 900;
		letter-spacing: -0.6px;
	}
	.prawna h2 {
		font-size: 18px;
		font-weight: 700;
		margin-top: 28px;
	}
	.prawna p {
		margin-top: 12px;
		color: var(--gray);
		line-height: 1.65;
	}
	.prawna p b {
		color: var(--ink);
	}
	.prawna a {
		color: var(--red);
	}
</style>
