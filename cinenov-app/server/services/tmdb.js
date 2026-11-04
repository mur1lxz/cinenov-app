const TMDB_BASE = "https://api.themoviedb.org/3";
const MAX_PAGES = 10;
const POSTER_PATH = /^\/[A-Za-z0-9_.-]+$/;

export class TmdbError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Mantém só o que o front usa e descarta caminhos de pôster suspeitos. */
function toMovie(m) {
  return {
    id: m.id,
    title: m.title || m.original_title || "Sem título",
    original_title: m.original_title || "",
    overview: m.overview || "",
    poster_path: POSTER_PATH.test(m.poster_path || "") ? m.poster_path : null,
    release_date: m.release_date || null,
    vote_average: Number(m.vote_average) || 0,
  };
}

/**
 * Cliente do TMDB com cache em memória. A chave da API fica só no servidor:
 * o navegador conversa com /api/movies/*, nunca direto com o TMDB.
 */
export function createTmdbService({ apiKey, ttlMs = 30 * 60 * 1000, fetchImpl = fetch } = {}) {
  const cache = new Map(); // endpoint -> { at, movies }
  const inflight = new Map(); // endpoint -> Promise

  async function fetchPage(endpoint, page) {
    const params = new URLSearchParams({ api_key: apiKey, language: "pt-BR", region: "BR", page: String(page) });
    let res;
    try {
      res = await fetchImpl(`${TMDB_BASE}/movie/${endpoint}?${params}`);
    } catch {
      throw new TmdbError(502, "Não foi possível falar com o TMDB agora. Tente novamente.");
    }
    if (res.status === 401) throw new TmdbError(503, "A chave do TMDB (TMDB_API_KEY) é inválida.");
    if (!res.ok) throw new TmdbError(502, "O TMDB não respondeu como esperado. Tente novamente.");
    return res.json();
  }

  async function load(endpoint) {
    const first = await fetchPage(endpoint, 1);
    const total = Math.min(first.total_pages || 1, MAX_PAGES);
    const rest = await Promise.all(
      Array.from({ length: total - 1 }, (_, i) => fetchPage(endpoint, i + 2).catch(() => ({ results: [] }))),
    );
    const seen = new Set();
    return [first, ...rest]
      .flatMap((p) => p.results || [])
      .filter((m) => !seen.has(m.id) && seen.add(m.id))
      .map(toMovie);
  }

  async function get(endpoint) {
    if (!apiKey) throw new TmdbError(503, "A chave do TMDB não está configurada no servidor (TMDB_API_KEY).");
    const hit = cache.get(endpoint);
    if (hit && Date.now() - hit.at < ttlMs) return hit.movies;
    if (!inflight.has(endpoint)) {
      inflight.set(
        endpoint,
        load(endpoint)
          .then((movies) => {
            cache.set(endpoint, { at: Date.now(), movies });
            return movies;
          })
          .finally(() => inflight.delete(endpoint)),
      );
    }
    return inflight.get(endpoint);
  }

  return {
    nowPlaying: () => get("now_playing"),
    upcoming: () => get("upcoming"),
  };
}
