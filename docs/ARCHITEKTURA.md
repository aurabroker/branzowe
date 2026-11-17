# Projekt: portal branżowy „ERGO Życie w Biznesie"

Wersja 1.0 · 2026-07-13 · stack: **SvelteKit · Cloudflare Workers · Supabase · Resend**

## 1. Cel i zakres

Portal sprzedażowy grupowego ubezpieczenia na życie **ERGO Życie w Biznesie** (oferta
branżowa 1.07–31.12.2026, firmy 2–100 osób, 8 branż). Dwa moduły, oba istnieją już jako
działające prototypy HTML w `prototypy/`:

1. **Kreator wniosku** (`prototypy/kreator-wniosku.html`) — 6-krokowy wizard:
   branża → wariant → rozszerzenia → struktura wiekowa → dane firmy (NIP/GUS) → zgody,
   zakończony złożeniem wniosku i mailem z arkuszem zgłoszeniowym.
2. **Zakres ochrony** (`prototypy/zakres-ochrony.html`) — przeglądarka wiedzy produktowej:
   pakiety dodatkowe, katalogi świadczeń (104 poważne zachorowania, 602 operacje),
   ograniczenia/karencje/wyłączenia, słowniczek — na danych z OWU.

Zadaniem tej aplikacji jest przenieść oba prototypy do produkcyjnej architektury:
statyczny/SSR frontend na Cloudflare, zapis wniosków w Supabase, maile przez Resend.

## 2. Dane źródłowe (`dane/`)

| Plik | Rozmiar | Zawartość | Użycie w aplikacji |
|---|---|---|---|
| `produkty.json` | 48 KB | 8 branż × 3 warianty, 77 świadczeń, 11 pakietów dodatkowych, MediOpieka, Global Doctors, składki | import statyczny do bundla — jedno źródło prawdy cennika |
| `owu.json` | 788 KB | OWU EZwB 01/25: 103 rozdziały (zdarzenia, karencje, wyłączenia, dokumenty), katalog 104 PZ, katalog 602 operacji, słowniczek | **nie do bundla** — cięty skryptem na porcje JSON serwowane statycznie / prerenderowane strony |
| `mo.json` | 148 KB | OWU MediOpieki MA 01/25: 23 rozdziały, 49 haseł słowniczka | jak wyżej |

Zasady dotyczące danych:

- Kwoty w wierszach tabel świadczeń **nie kumulują się** (wartość wiersza to już kwota
  skumulowana) — każdy widok tabeli musi to komunikować.
- Pakiet główny rozlicza operacje w **5 podgrupach** (100/75/50/25/10 %) — pakiety
  dodatkowe 3-podgrupowe pokazujemy tylko po jawnym przełączeniu, z ostrzeżeniem.
- Stomatologia: warianty **nie są monotoniczne** (Wariant III ma wyższe sumy zgonowe niż I)
  — UI nie może zakładać „im wyższy wariant, tym więcej".
- `LUKA` / `BRAK_DANYCH` w danych OWU: pola oznaczone jako luki wyświetlamy jako luki,
  nigdy nie uzupełniamy domysłem (wymóg z `_meta` w prototypie zakresu ochrony).
- Składka MediPlanu (2,80 zł, bez rozbicia na 3 warianty) — otwarta kwestia do taryfy.

## 3. Architektura wysokiego poziomu

```
przeglądarka ──► Cloudflare Workers (SvelteKit SSR + statyczne assety)
                    │
                    ├─ GET  /zakres-ochrony/*     ← prerender (dane OWU w HTML)
                    ├─ GET  /api/gus?nip=…        ← proxy do API REGON (klucz w sekrecie)
                    └─ POST /api/wnioski          ─► Supabase (service role, INSERT)
                                                  ─► Resend (2 maile: klient + opiekun)
```

- **Frontend**: SvelteKit 2 + Svelte 5, `@sveltejs/adapter-cloudflare`. Kreator jest w
  całości klientem (stan w pamięci + `sessionStorage`), zakres ochrony jest prerenderowany.
- **Backend**: wyłącznie endpointy `+server.ts` w SvelteKit — bez osobnego API.
  Klient **nie** rozmawia z Supabase bezpośrednio; klucz `service_role` żyje tylko
  w sekretach Workera. Dzięki temu nie potrzebujemy RLS dla ruchu anonimowego ani
  supabase-js w bundlu klienta.
- **Baza**: Supabase Postgres — wnioski, wersjonowane cenniki, log zdarzeń.
- **Maile**: Resend z domeny `utratadochodu.com` (do weryfikacji DKIM/SPF w Resend).

## 4. Struktura repozytorium (docelowa)

```
├─ dane/                     # dane źródłowe (commitowane, wejście dla skryptów)
├─ prototypy/                # prototypy HTML — referencja wyglądu i zachowania
├─ docs/ARCHITEKTURA.md
├─ scripts/
│   └─ tnij-owu.mjs          # owu.json + mo.json → static/dane/owu/*.json (porcje ≤100 KB)
├─ src/
│   ├─ lib/
│   │   ├─ dane/produkty.json
│   │   ├─ domena/           # czysta logika, bez UI — testowalna jednostkowo
│   │   │   ├─ skladka.ts    # wyliczenia: pakiet główny, widełki adopcji, rozbicie
│   │   │   ├─ pesel.ts      # walidacja + rok/płeć z PESEL (WYŁĄCZNIE klient)
│   │   │   ├─ nip.ts        # suma kontrolna NIP
│   │   │   └─ typy.ts       # typy wygenerowane ze struktury produkty.json
│   │   ├─ komponenty/       # Kafelek, WariantKarta, TabelaSwiadczen, PasekSkladki…
│   │   └─ serwer/
│   │       ├─ supabase.ts   # klient service-role (tylko import po stronie serwera)
│   │       ├─ resend.ts     # wysyłka maili + szablony
│   │       └─ gus.ts        # klient API REGON
│   └─ routes/
│       ├─ +page.svelte                       # landing (hero z prototypu)
│       ├─ wniosek/+page.svelte               # wizard, ?krok=1..6
│       ├─ wniosek/dziekujemy/+page.svelte
│       ├─ zakres-ochrony/[zakladka]/+page.ts # prerender 4 zakładek
│       └─ api/
│           ├─ gus/+server.ts                 # GET, proxy REGON
│           └─ wnioski/+server.ts             # POST, walidacja zod → insert → maile
├─ supabase/migrations/
├─ static/dane/owu/          # wynik tnij-owu.mjs (generowane, w .gitignore lub commit)
└─ wrangler.jsonc
```

## 5. Model danych (Supabase)

```sql
-- wersjonowany cennik: produkty.json wgrywane jako snapshot;
-- wniosek zapisuje id cennika, z którego liczono składkę
create table cenniki (
  id            bigint generated always as identity primary key,
  wersja        text not null unique,          -- np. 'branze-2607'
  obowiazuje_od date not null,
  obowiazuje_do date not null,
  dane          jsonb not null,
  utworzono     timestamptz not null default now()
);

create table wnioski (
  id             uuid primary key default gen_random_uuid(),
  nr_wniosku     text not null unique,         -- 'EZB-2026-000123', sekwencja + prefiks
  cennik_id      bigint not null references cenniki(id),
  branza         text not null,                -- slug z produkty.json
  wariant        smallint not null check (wariant between 1 and 3),
  rozszerzenia   jsonb not null default '{}',  -- {medi:{...}, gd:bool, pakiety:{slug:wariant}}
  zalozona_adopcja numeric(3,2),               -- 0.00–1.00 (suwak z kroku 3)
  liczba_osob    smallint not null check (liczba_osob between 2 and 100),
  struktura      jsonb,                        -- AGREGAT: [{rok, plec, liczba}] albo null (tryb "podam później")
  firma          jsonb not null,               -- {nip, nazwa, pkd, adres, zrodlo:'gus'|'recznie'}
  kontakt        jsonb not null,               -- {imie, stanowisko, email, telefon, start_ochrony}
  zgody          jsonb not null,               -- {kod_zgody: {tresc_wersja, ts}}
  skladka        jsonb not null,               -- zamrożone wyliczenie: {os, min, max, szacunek}
  status         text not null default 'nowy'  -- nowy → przekazany → oferta → polisa / odrzucony
                 check (status in ('nowy','przekazany','oferta','polisa','odrzucony')),
  utworzono      timestamptz not null default now()
);

-- log zdarzeń lejka (bez danych osobowych): wejścia w kroki, porzucenia
create table zdarzenia (
  id        bigint generated always as identity primary key,
  sesja     uuid not null,                     -- anonimowy identyfikator z sessionStorage
  typ       text not null,                     -- 'krok', 'branza', 'wyslano', …
  dane      jsonb,
  utworzono timestamptz not null default now()
);
```

RLS: `enable row level security` na wszystkich tabelach **bez żadnych polityk dla anon** —
dostęp ma wyłącznie service role z Workera. Panel dla opiekuna (przyszłość) dostanie
własne polityki po `auth.uid()`.

### PESEL i RODO — twarda zasada

PESEL-e z kroku „struktura" **nigdy nie opuszczają przeglądarki** (tak obiecuje UI
prototypu i tak ma działać produkcja). `pesel.ts` przelicza wiersze na agregat
`[{rok, plec, liczba}]` w kliencie; do `/api/wnioski` trafia wyłącznie agregat.
Endpoint waliduje zodem, że w polu `struktura` nie ma nic ponad ten kształt
(odrzuca stringi 11-cyfrowe gdziekolwiek w payloadzie — walidacja negatywna).

## 6. Przepływy

### 6.1 Kreator wniosku (`/wniosek`)

Stan wizarda: obiekt `Wniosek` w svelte-store, mirror w `sessionStorage`
(odświeżenie strony nie kasuje postępu; zamknięcie karty — tak, zgodnie z obietnicą
prywatności). Krok w `?krok=` dla działającego „wstecz" przeglądarki.

Logika składki (`skladka.ts`), przeniesiona 1:1 z prototypu:

- pakiet główny: `skladka[wariant]` × liczba osób — **gwarantowana**;
- rozszerzenia: pracownik wybiera w deklaracji, więc koszt firmy to **widełki**
  `[0 % adopcji, 100 % adopcji]` + szacunek dla założonej adopcji z suwaka;
- rozbicie składki (panel „rozbij składkę") liczone z tych samych danych.

Walidacje blokujące przejścia: 2 ≤ osób ≤ 100, wiek 15–70 (z agregatu), suma
kontrolna NIP, wymagane zgody. GUS: wynik `>100 zatrudnionych` ⇒ komunikat
o ofercie indywidualnej i stop (jak w prototypie).

### 6.2 Zapis wniosku (`POST /api/wnioski`)

1. Walidacja zod (w tym negatywna walidacja PESEL — patrz §5).
2. Przeliczenie składki **po stronie serwera** z aktualnego `cennika` — klientowi nie
   ufamy; różnica ⇒ 409 z aktualnym wyliczeniem.
3. `insert` do `wnioski` (nr z sekwencji Postgresa), `insert` zdarzenia `wyslano`.
4. Resend, dwa maile:
   - **do klienta** (adres z kroku 5): potwierdzenie, nr wniosku, podsumowanie wyboru,
     załącznik `lista-ubezpieczonych.xlsx` — w v1 **statyczny szablon** arkusza
     zgłoszeniowego (plik w `static/`), nie generowany dynamicznie; jeśli struktura
     została podana, mail zawiera adnotację „wniosek kompletny";
   - **do opiekuna** (`biuro@utratadochodu.com`): nowy wniosek + link do rekordu.
5. Błąd Resend ⇒ wniosek i tak zapisany, mail w tabeli `zdarzenia` jako `mail_blad`
   do ręcznego ponowienia — utrata leada jest droższa niż brak maila.

### 6.3 GUS (`GET /api/gus?nip=`)

Proxy do API REGON (BIR1.1); klucz w sekrecie `GUS_API_KEY`. Cache odpowiedzi
w `caches.default` (24 h) — NIP-y się powtarzają przy powrotach do formularza.
Timeout 5 s; przy braku odpowiedzi front przechodzi w tryb ręcznego wpisania danych
(prototyp ma już te cztery scenariusze w symulatorze: ok / >100 / brak / awaria).

### 6.4 Zakres ochrony (`/zakres-ochrony/*`)

Cztery prerenderowane podstrony zamiast SPA z 892 KB danych w jednym pliku:

```
/zakres-ochrony/pakiety       ← produkty.json + opisy pakietów
/zakres-ochrony/katalogi      ← katalog 104 PZ + 602 operacje (tabele z wyszukiwarką)
/zakres-ochrony/ograniczenia  ← karencje/wyłączenia per rozdział OWU
/zakres-ochrony/slowniczek    ← 49 haseł MO + hasła EZwB
```

`scripts/tnij-owu.mjs` tnie `owu.json`/`mo.json` na pliki tematyczne w
`static/dane/owu/` (katalog operacji dodatkowo stronicowany po ~150 pozycji).
Strony prerenderują szkielet + pierwszą porcję; wyszukiwarka dociąga resztę JSON-ów
leniwie. Zysk: SEO, szybki first paint, zero martwego JS.

## 7. Konfiguracja i wdrożenie

| Sekret (Wrangler) | Użycie |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/serwer/supabase.ts` |
| `RESEND_API_KEY` | wysyłka maili |
| `GUS_API_KEY` | API REGON |

- Deploy: Cloudflare Workers przez `wrangler deploy` z GitHub Actions
  (build → `svelte-kit build` → deploy); podgląd PR przez `wrangler versions upload`.
- Migracje: `supabase db push` z CI albo ręcznie na starcie (v1).
- Cennik: seed `cenniki` z `dane/produkty.json` w migracji; zmiana cennika = nowy
  wiersz, stare wnioski trzymają referencję do swojego.

## 8. Plan implementacji

| Etap | Zakres | Wynik |
|---|---|---|
| **M1** | szkielet SvelteKit + adapter CF, `tnij-owu.mjs`, `/zakres-ochrony/*` prerender | działający moduł wiedzy na produkcji |
| **M2** | kreator: kroki 1–6, `skladka.ts` + `pesel.ts` + `nip.ts` z testami, pasek składki | wizard end-to-end na mockach API |
| **M3** | Supabase (migracje + seed cennika), `POST /api/wnioski`, Resend, `GET /api/gus` | wniosek trafia do bazy, maile wychodzą |
| **M4** | log zdarzeń lejka, dostępność (klawiatura w wizardzie), teksty prawne zgód, obrazy branż (własny hosting zamiast trybloom) | gotowe do ruchu |

## 9. Otwarte kwestie (wymagają decyzji poza kodem)

1. **Taryfa MediPlanu** — cennik podaje jedną składkę 2,80 zł bez rozbicia na 3 warianty
   (flaga `UWAGA` w danych). Do potwierdzenia u ubezpieczyciela.
2. **Treści zgód** (krok 6) — prototyp ma placeholdery; potrzebne finalne klauzule
   (marketingowa, RODO, dystrybucja ubezpieczeń) z wersjonowaniem treści.
3. **Szablon XLSX** arkusza zgłoszeniowego ERGO Hestii — potrzebny oryginalny plik.
4. **Domena i adresy nadawcze** Resend (`wnioski@…`) — weryfikacja `utratadochodu.com`.
5. **Klucz API REGON** — rejestracja w GUS.
6. Zdjęcia branż hostowane dziś na `trybloom.ai` — do przeniesienia do `static/`.
