# branzowe

Ergo Razem — branżowe ubezpieczenia grupowe od 2 do 100 osób.

Portal sprzedażowy produktu **ERGO Życie w Biznesie** (oferta branżowa 1.07–31.12.2026):
kreator wniosku dla firm 2–100 osób oraz przeglądarka zakresu ochrony na danych z OWU.

Stack: **SvelteKit 2 / Svelte 5 · Cloudflare Workers · Supabase · Resend**.

## Uruchomienie

```bash
npm install
npm run tnij-owu   # tnie dane/owu.json + mo.json → static/dane/owu/ (robi to też build)
npm run dev        # dev server
npm test           # testy logiki domenowej (vitest)
npm run check      # svelte-check
npm run build      # produkcyjny build (adapter Cloudflare)
```

## Wdrożenie

1. **Supabase**: wykonaj `supabase/migrations/20260713120000_init.sql`, potem zasil cennik:
   `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-cennika.mjs`
2. **Sekrety Workera** (`wrangler secret put …`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, `MAIL_OD`, `MAIL_OPIEKUN`, `GUS_API_KEY` — wzór w `.env.example`.
3. `npx wrangler deploy`.

## Struktura

- `docs/ARCHITEKTURA.md` — pełny projekt: architektura, model danych, przepływy, plan
- `dane/` — dane źródłowe (produkty.json, owu.json, mo.json, zakres-marketing.json)
- `prototypy/` — prototypy HTML (referencja UX)
- `scripts/tnij-owu.mjs` — dzieli 900 KB danych OWU na porcje do `static/dane/owu/`
- `src/lib/domena/` — czysta logika (składka, PESEL→agregat, NIP) z testami
- `src/lib/serwer/` — Supabase (service role), Resend, klient SOAP API REGON
- `src/routes/wniosek` — 6-krokowy kreator (bez SSR; PESEL-e nie opuszczają przeglądarki)
- `src/routes/zakres-ochrony/[zakladka]` — prerenderowane: pakiety / katalogi / ograniczenia / słowniczek
- `src/routes/api/{gus,wnioski}` — proxy REGON i przyjęcie wniosku (walidacja zod,
  przeliczenie składki po stronie serwera, zapis + maile)

## Zasada RODO

PESEL-e z kroku „struktura zespołu" są parsowane wyłącznie w przeglądarce; do API trafia
agregat `[{rok, płeć, liczba}]`. Endpoint `/api/wnioski` odrzuca payload zawierający
jakikolwiek ciąg 11 cyfr (poza numerem telefonu).
