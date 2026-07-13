# branzowe

Ergo Razem — branżowe ubezpieczenia grupowe od 2 do 100 osób.

Portal sprzedażowy produktu **ERGO Życie w Biznesie** (oferta branżowa 1.07–31.12.2026):
kreator wniosku dla firm 2–100 osób oraz przeglądarka zakresu ochrony na danych z OWU.

Stack: **SvelteKit · Cloudflare Workers · Supabase · Resend**.

## Zawartość repozytorium

- `docs/ARCHITEKTURA.md` — pełny projekt aplikacji: architektura, model danych, przepływy, plan wdrożenia
- `dane/` — dane źródłowe: `produkty.json` (cennik i świadczenia), `owu.json` (OWU EZwB 01/25), `mo.json` (OWU MediOpieki MA 01/25)
- `prototypy/` — działające prototypy HTML (referencja UX): `kreator-wniosku.html`, `zakres-ochrony.html`

Prototypy można otworzyć bezpośrednio w przeglądarce — nie wymagają serwera.
