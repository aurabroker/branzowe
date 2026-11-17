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

1. **Supabase**: wykonaj migracje z `supabase/migrations/` w kolejności nazw
   (`20260713120000_init.sql`, potem `20260904120000_zrodlo_wizyty.sql`), potem zasil cennik:
   `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-cennika.mjs`
   Migracje wykonaj **przed** wdrożeniem Workera. Gdyby kolejność się odwróciła,
   wniosek i tak zostanie zapisany — bez atrybucji i z wpisem `atrybucja_pominieta`
   w `ezb_zdarzenia`.
2. **Sekrety Workera** (`wrangler secret put …`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, `MAIL_OD`, `MAIL_OPIEKUN`, `GUS_API_KEY` — wzór w `.env.example`.
3. `npx wrangler deploy`.
4. Domena produkcyjna: **ergo.auraexpert.pl** (Workers → branzowe2 → Settings → Domains & Routes).

Maile transakcyjne wychodzą z `zgloszenie@auraexpert.pl` (domena zweryfikowana w Resend);
gdy wniosek nie zawiera struktury wiekowej, mail do klienta ma w załączniku arkusz
`static/dokumenty/lista-ubezpieczonych.xlsx`.

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
- `src/routes/branza/[slug]` — prerenderowane landingi branżowe (8 stron),
  treści w `src/lib/dane/branze-landing.json`, kwoty brane z cennika
- `src/routes/{sitemap.xml,robots.txt}` — mapa strony i robots; kroki lejka
  (`/wniosek`) są poza indeksem przez `noindex` i nagłówek `X-Robots-Tag`
- `src/lib/zrodlo.ts` — atrybucja kampanii (first touch) trafiająca do wniosku

## Atrybucja kampanii

Parametry UTM i identyfikatory kliknięcia z adresu wejścia są zapisywane w
`sessionStorage` przy pierwszym wejściu w sesji (zasada first touch) i dołączane
do wniosku jako `zrodlo_wizyty`. Zbieramy wyłącznie parametry kampanii, ścieżkę
wejścia i domenę odsyłającą — bez ciasteczek i bez danych osobowych.

Raport „który landing sprzedaje" idzie po `zrodlo_wizyty ->> 'utm_campaign'`
albo `->> 'wejscie'` (oba mają indeks).

## Zasada RODO

PESEL-e z kroku „struktura zespołu" są parsowane wyłącznie w przeglądarce; do API trafia
agregat `[{rok, płeć, liczba}]`. Endpoint `/api/wnioski` odrzuca payload zawierający
jakikolwiek ciąg 11 cyfr (poza numerem telefonu).
