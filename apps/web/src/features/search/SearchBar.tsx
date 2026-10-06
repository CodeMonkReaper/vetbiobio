// Placeholder buscador principal: ¿Qué necesitas? + ¿Dónde? → /veterinarias?q=&commune=
export function SearchBar() {
  return (
    <form action="/veterinarias" method="get" role="search">
      <label htmlFor="q">¿Qué necesitas?</label>
      <input id="q" name="q" placeholder="Buscar veterinaria, servicio o especialidad" />
      <label htmlFor="commune">¿Dónde?</label>
      <input id="commune" name="commune" placeholder="Concepción" />
      <button type="submit">Buscar</button>
    </form>
  );
}
