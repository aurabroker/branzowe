-- ERGO Życie w Biznesie — schemat początkowy.
-- Dostęp wyłącznie przez service role z Workera: RLS włączone, zero polityk dla anon.

create table cenniki (
  id            bigint generated always as identity primary key,
  wersja        text not null unique,
  obowiazuje_od date not null,
  obowiazuje_do date not null,
  dane          jsonb not null,
  utworzono     timestamptz not null default now()
);

create sequence wnioski_nr;

create table wnioski (
  id               uuid primary key default gen_random_uuid(),
  nr_wniosku       text not null unique
                   default ('EZB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('wnioski_nr')::text, 6, '0')),
  cennik_wersja    text not null references cenniki(wersja),
  branza           text not null,
  wariant          smallint not null check (wariant between 1 and 3),
  rozszerzenia     jsonb not null default '{}',
  zalozona_adopcja numeric(3,2) check (zalozona_adopcja between 0 and 1),
  liczba_osob      smallint not null check (liczba_osob between 2 and 100),
  -- agregat [{rok, plec, liczba}] albo null (klient odeśle arkusz);
  -- twarda zasada: żadnych PESEL-i ani dat urodzenia
  struktura        jsonb,
  firma            jsonb not null,
  kontakt          jsonb not null,
  zgody            jsonb not null,
  skladka          jsonb not null,
  status           text not null default 'nowy'
                   check (status in ('nowy','przekazany','oferta','polisa','odrzucony')),
  utworzono        timestamptz not null default now()
);

create index wnioski_status_idx on wnioski (status, utworzono desc);

create table zdarzenia (
  id        bigint generated always as identity primary key,
  sesja     uuid not null,
  typ       text not null,
  dane      jsonb,
  utworzono timestamptz not null default now()
);

create index zdarzenia_typ_idx on zdarzenia (typ, utworzono desc);

alter table cenniki   enable row level security;
alter table wnioski   enable row level security;
alter table zdarzenia enable row level security;
-- celowo brak polityk: dostęp ma tylko service role (omija RLS)
