/** Minúsculas e sem acentos: "Ação" e "acao" viram a mesma coisa. */
export function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Filtra por título (em português ou original). Todas as palavras digitadas precisam aparecer. */
export function filterMovies(movies, query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return movies;
  return movies.filter((m) => {
    const haystack = normalize(`${m.title} ${m.original_title}`);
    return tokens.every((t) => haystack.includes(t));
  });
}
