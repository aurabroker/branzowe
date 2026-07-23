// Kreator działa w całości w przeglądarce: stan w pamięci + sessionStorage,
// PESEL-e parsowane lokalnie — bez SSR nie ma ryzyka współdzielenia stanu
// między żądaniami na serwerze.
export const ssr = false;
