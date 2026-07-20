# Zdjęcia promocyjne

Wrzuć tutaj zdjęcia (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`), które mają się
pokazywać **losowo** na ekranie „Wniosek przyjęty" (`/wniosek/dziekujemy`),
nad przyciskiem „Zacznij od nowa". Każde zdjęcie jest linkiem do
<https://utratadochodu.pl>.

Pliki są wykrywane automatycznie w czasie budowania (przez `src/lib/promo.ts`) —
nie trzeba nigdzie dopisywać nazw. Wystarczy dodać plik do tego katalogu i
zbudować/wdrożyć aplikację.

Zalecenia:

- proporcje poziome (np. 1200×630 lub 2:1) — tak jest wyświetlany baner,
- format `.webp` dla mniejszego rozmiaru,
- kilka plików = losowa rotacja przy każdej wizycie.

Dopóki katalog jest pusty (poza tym plikiem), baner po prostu się nie pojawia.
