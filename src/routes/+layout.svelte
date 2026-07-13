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

<style>
	@media (max-width: 700px) {
		.top .meta {
			display: none;
		}
	}
</style>
