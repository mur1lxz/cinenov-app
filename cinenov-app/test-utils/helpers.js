import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { loadConfig } from "../server/config.js";

export const fakeMovies = [
  { id: 1, title: "Duna: Parte Três", original_title: "Dune: Part Three", overview: "Areia.", poster_path: "/a.jpg", release_date: "2026-11-05", vote_average: 8.1 },
  { id: 2, title: "Ação Explosiva", original_title: "Big Action", overview: "Boom.", poster_path: null, release_date: "2026-10-20", vote_average: 6.2 },
];

/** Sobe o app com SQLite em memória e TMDB falso; não depende de uma conta Supabase. */
export async function startTestServer({ tmdb } = {}) {
  const config = loadConfig({
    JWT_SECRET: "x".repeat(40),
    AUTH_RATE_LIMIT_MAX: "1000",
  });
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const users = {
    async findByEmail(email) {
      return db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email) ?? null;
    },
    async findById(id) {
      return db.prepare("SELECT id, email, password_hash FROM users WHERE id = ?").get(id) ?? null;
    },
    async create(email, passwordHash) {
      const result = db
        .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .run(email, passwordHash);
      return db.prepare("SELECT id, email, password_hash FROM users WHERE id = ?").get(Number(result.lastInsertRowid));
    },
  };

  const fakeTmdb = tmdb ?? { nowPlaying: async () => fakeMovies, upcoming: async () => [] };
  const app = createApp({ config, users, tmdb: fakeTmdb });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    baseUrl,
    db,
    close: () => new Promise((resolve) => server.close(() => {
      db.close();
      resolve();
    })),
  };
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

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
