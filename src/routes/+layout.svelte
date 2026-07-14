<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<header class="top">
	<div class="wrap">
		<a class="logo" href="/"><b>ERGO</b><span>HESTIA</span></a>
		<nav>
			<a href="/wniosek" class={page.url.pathname.startsWith('/wniosek') ? 'on' : ''}>Kreator wniosku</a>
			<a href="/zakres-ochrony/pakiety" class={page.url.pathname.startsWith('/zakres-ochrony') ? 'on' : ''}
				>Zakres ochrony</a
			>
		</nav>
		<div class="meta">
			Grupowe ubezpieczenie na życie · <b style="color:var(--red)">2–100 osób</b><br />
			<b>ERGO Życie w Biznesie</b> · oferta branżowa 1.07–31.12.2026
		</div>
	</div>
</header>

{@render children()}

<footer class="stopka">
	<div class="wrap">
		<div class="kol">
			<b>Aura Expert sp. z o.o.</b>
			<p>
				Dystrybutor ubezpieczeń. Kontakt:
				<a href="mailto:zgloszenie@auraexpert.pl">zgloszenie@auraexpert.pl</a>
			</p>
		</div>
		<nav class="kol linki">
			<a href="/o-nas">O nas</a>
			<a href="/regulamin">Regulamin</a>
			<a href="/rodo">RODO</a>
		</nav>
		<div class="kol drobne">
			<p>
				Materiał informacyjny — nie jest ofertą w rozumieniu art. 66 k.c. Wiążące są wyłącznie OWU:
				EZwB 01/25, MA 01/25, GD-GZ 01/25. Ubezpieczyciel: Sopockie Towarzystwo Ubezpieczeń na Życie
				ERGO Hestia S.A.
			</p>
		</div>
	</div>
</footer>

<style>
	@media (max-width: 700px) {
		.top .meta {
			display: none;
		}
	}
	.stopka {
		background: var(--ink);
		color: #c5c5c5;
		margin-top: 0;
		font-size: 13px;
	}
	.stopka .wrap {
		display: grid;
		grid-template-columns: 1fr auto 2fr;
		gap: 40px;
		padding-top: 32px;
		padding-bottom: 32px;
		align-items: start;
	}
	.stopka b {
		color: #fff;
		display: block;
		margin-bottom: 6px;
	}
	.stopka a {
		color: #fff;
		text-decoration: underline;
	}
	.linki {
		display: flex;
		flex-direction: column;
		gap: 8px;
		white-space: nowrap;
	}
	.linki a {
		text-decoration: none;
		color: #c5c5c5;
	}
	.linki a:hover {
		color: #fff;
	}
	.drobne p {
		font-size: 11.5px;
		color: #8a8a8a;
		line-height: 1.6;
	}
	@media (max-width: 700px) {
		.stopka .wrap {
			grid-template-columns: 1fr;
			gap: 20px;
		}
	}
</style>
