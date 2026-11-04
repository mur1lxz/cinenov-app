import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { TmdbError, createTmdbService } from "../server/services/tmdb.js";
import { createClient, fakeMovies, startTestServer } from "../test-utils/helpers.js";

async function loggedIn(srv) {
  const c = createClient(srv.baseUrl);
  await c.request("POST", "/api/auth/register", { email: "cine@email.com", password: "senha-forte-1" });
  await c.request("POST", "/api/auth/login", { email: "cine@email.com", password: "senha-forte-1" });
  return c;
}

describe("rotas de filmes", () => {
  let srv;
  before(async () => {
    srv = await startTestServer();
  });
  after(() => srv.close());

  it("exige login", async () => {
    const c = createClient(srv.baseUrl);
    assert.equal((await c.request("GET", "/api/movies/now-playing")).status, 401);
  });

  it("devolve os filmes em cartaz para quem está logado", async () => {
    const c = await loggedIn(srv);
    const r = await c.request("GET", "/api/movies/now-playing");
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.results, fakeMovies);
    assert.deepEqual((await c.request("GET", "/api/movies/upcoming")).json.results, []);
  });
});

describe("erros do TMDB chegam ao front como JSON amigável", () => {
  it("sem chave configurada responde 503", async () => {
    const tmdb = createTmdbService({ apiKey: "" });
    const srv = await startTestServer({ tmdb });
    try {
      const c = await loggedIn(srv);
      const r = await c.request("GET", "/api/movies/now-playing");
      assert.equal(r.status, 503);
      assert.match(r.json.error, /TMDB_API_KEY/);
    } finally {
      await srv.close();
    }
  });
});

describe("serviço do TMDB", () => {
  const page = (n, total, ids) => ({
    ok: true,
    status: 200,
    json: async () => ({ total_pages: total, results: ids.map((id) => ({ id, title: `Filme ${id}`, poster_path: "/p.jpg", vote_average: 7 })) }),
  });

  it("junta as páginas, remove duplicados e reaproveita o cache", async () => {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(url);
      const n = Number(new URL(url).searchParams.get("page"));
      return n === 1 ? page(1, 2, [1, 2]) : page(2, 2, [2, 3]);
    };
    const tmdb = createTmdbService({ apiKey: "k", fetchImpl });
    const movies = await tmdb.nowPlaying();
    assert.deepEqual(movies.map((m) => m.id), [1, 2, 3]);
    await tmdb.nowPlaying();
    assert.equal(urls.length, 2, "a segunda chamada deve vir do cache");
    assert.ok(urls[0].includes("language=pt-BR") && urls[0].includes("region=BR"));
  });

  it("descarta caminhos de pôster suspeitos", async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ total_pages: 1, results: [{ id: 9, title: "X", poster_path: "/x');background:url(//evil" }] }),
    });
    const [m] = await createTmdbService({ apiKey: "k", fetchImpl }).nowPlaying();
    assert.equal(m.poster_path, null);
  });

  it("traduz chave inválida e falha de rede, sem expor a chave", async () => {
    const bad = createTmdbService({ apiKey: "segredo123", fetchImpl: async () => ({ ok: false, status: 401 }) });
    await assert.rejects(bad.nowPlaying(), (e) => e instanceof TmdbError && e.status === 503 && !e.message.includes("segredo123"));
    const down = createTmdbService({ apiKey: "k", fetchImpl: async () => { throw new Error("ECONNREFUSED segredo123"); } });
    await assert.rejects(down.nowPlaying(), (e) => e instanceof TmdbError && e.status === 502 && !e.message.includes("segredo123"));
  });
});
