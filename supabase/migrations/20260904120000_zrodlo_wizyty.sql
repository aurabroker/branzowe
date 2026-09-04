-- Atrybucja kampanii: skąd przyszedł wniosek.
--
-- Kolumna jest opcjonalna. Wnioski sprzed tej migracji mają NULL, a wnioski
-- z wejść bezpośrednich (bez parametrów kampanii i bez odsyłającego) też —
-- brak atrybucji nigdy nie blokuje przyjęcia wniosku.
--
-- Kształt: {utm_source, utm_medium, utm_campaign, utm_content, utm_term,
--           gclid, fbclid, msclkid, wejscie, skad, ts}
-- Wypełniane wyłącznie z parametrów adresu wejścia — bez danych osobowych.

alter table ezb_wnioski add column if not exists zrodlo_wizyty jsonb;

comment on column ezb_wnioski.zrodlo_wizyty is
  'Źródło wizyty wg zasady first touch: parametry UTM, identyfikator kliknięcia, '
  'ścieżka wejścia i domena odsyłająca. Bez danych osobowych. NULL = wejście bezpośrednie.';

-- Raport „który landing sprzedaje": wnioski po kampanii i po stronie wejścia.
create index if not exists ezb_wnioski_kampania_idx
  on ezb_wnioski ((zrodlo_wizyty ->> 'utm_campaign'), utworzono desc)
  where zrodlo_wizyty is not null;

create index if not exists ezb_wnioski_wejscie_idx
  on ezb_wnioski ((zrodlo_wizyty ->> 'wejscie'), utworzono desc)
  where zrodlo_wizyty is not null;
