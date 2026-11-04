const IMG_BASE = "https://image.tmdb.org/t/p/w500";

export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const formatDate = (d) =>
  d
    ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : "Data a definir";

export function heartIcon(active) {
  return active ? "♥" : "♡";
}

export function cardHTML(movie, { favorite, index }) {
  const poster = movie.poster_path
    ? `<img src="${IMG_BASE}${esc(movie.poster_path)}" alt="Pôster de ${esc(movie.title)}" loading="lazy" />`
    : `<span class="poster-title">${esc(movie.title)}</span>`;
  const badge = movie.vote_average
    ? `<span class="rating">★ ${movie.vote_average.toFixed(1)}</span>`
    : `<span class="rating soon">Em breve</span>`;

  return `
    <article class="card" style="--i:${Math.min(index, 20)}">
      <div class="poster${movie.poster_path ? "" : " no-poster"}">
        ${poster}
        <button type="button" class="fav-btn${favorite ? " active" : ""}" data-id="${movie.id}"
          aria-label="${favorite ? "Remover dos" : "Adicionar aos"} favoritos" aria-pressed="${favorite}">${heartIcon(favorite)}</button>
        ${badge}
      </div>
      <div class="info">
        <h3>${esc(movie.title)}</h3>
        <p class="date">${formatDate(movie.release_date)}</p>
        <p class="overview" title="${esc(movie.overview)}">${esc(movie.overview || "Sinopse não disponível.")}</p>
      </div>
    </article>`;
}
