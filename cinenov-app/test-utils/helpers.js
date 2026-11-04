import { createApp } from "../server/app.js";
import { loadConfig } from "../server/config.js";
import { openDatabase } from "../server/db/index.js";

export const fakeMovies = [
  { id: 1, title: "Duna: Parte Três", original_title: "Dune: Part Three", overview: "Areia.", poster_path: "/a.jpg", release_date: "2026-11-05", vote_average: 8.1 },
  { id: 2, title: "Ação Explosiva", original_title: "Big Action", overview: "Boom.", poster_path: null, release_date: "2026-10-20", vote_average: 6.2 },
];

/** Sobe o app numa porta livre, com banco em memória e TMDB falso. */
export async function startTestServer({ tmdb } = {}) {
  const config = loadConfig({ JWT_SECRET: "x".repeat(40), DB_PATH: ":memory:", AUTH_RATE_LIMIT_MAX: "1000" });
  const db = openDatabase(":memory:");
  const fakeTmdb = tmdb ?? { nowPlaying: async () => fakeMovies, upcoming: async () => [] };
  const app = createApp({ config, db, tmdb: fakeTmdb });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return { baseUrl, db, close: () => new Promise((r) => server.close(r)) };
}

/** Cliente fetch com "cookie jar" de um cookie só (suficiente para a sessão). */
export function createClient(baseUrl) {
  let cookie = "";
  return {
    get cookie() {
      return cookie;
    },
    async request(method, path, body) {
      const res = await fetch(baseUrl + path, {
        method,
        headers: { "Content-Type": "application/json", ...(cookie && { Cookie: cookie }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const set = res.headers.get("set-cookie");
      if (set) cookie = set.startsWith("cinenov_session=;") ? "" : set.split(";")[0];
      const text = await res.text();
      return { status: res.status, headers: res.headers, json: text ? safeJson(text) : null };
    },
  };
}
function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
