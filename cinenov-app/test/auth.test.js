import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, startTestServer } from "../test-utils/helpers.js";

describe("autenticação", () => {
  let srv;
  before(async () => {
    srv = await startTestServer();
  });
  after(() => srv.close());

  it("serve a página inicial do CineNov", async () => {
    const response = await fetch(`${srv.baseUrl}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\\/html/);
    assert.match(await response.text(), /CineNov/);
  });

  it("expõe um endpoint simples de saúde", async () => {
    const response = await fetch(`${srv.baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: "cinenov" });
  });

  it("cadastra, faz login, identifica o usuário e faz logout", async () => {
    const c = createClient(srv.baseUrl);

    let r = await c.request("POST", "/api/auth/register", { email: "Ana@Email.com ", password: "senha-forte-1" });
    assert.equal(r.status, 201);
    assert.equal(r.json.email, "ana@email.com");

    r = await c.request("GET", "/api/auth/me");
    assert.equal(r.status, 401, "cadastrar não deve logar automaticamente");

    r = await c.request("POST", "/api/auth/login", { email: "ANA@email.com", password: "senha-forte-1" });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("set-cookie"), /HttpOnly/i);
    assert.match(r.headers.get("set-cookie"), /SameSite=Lax/i);

    r = await c.request("GET", "/api/auth/me");
    assert.equal(r.status, 200);
    assert.equal(r.json.email, "ana@email.com");

    r = await c.request("POST", "/api/auth/logout");
    assert.equal(r.status, 204);
    r = await c.request("GET", "/api/auth/me");
    assert.equal(r.status, 401);
  });

  it("guarda apenas o hash da senha, nunca a senha em si", async () => {
    const c = createClient(srv.baseUrl);
    await c.request("POST", "/api/auth/register", { email: "hash@email.com", password: "minha-senha-secreta" });
    const row = srv.db.prepare("SELECT * FROM users WHERE email = ?").get("hash@email.com");
    assert.ok(row.password_hash.startsWith("scrypt$"));
    assert.equal(row.password_legacy, null);
    assert.ok(!row.password_hash.includes("minha-senha-secreta"));
  });

  it("migra uma conta antiga com senha em texto puro no primeiro login válido", async () => {
    const insert = srv.db.prepare("INSERT INTO users (email, password_legacy) VALUES (?, ?)");
    insert.run("legado@email.com", "senha-antiga-secreta");

    const c = createClient(srv.baseUrl);
    const response = await c.request("POST", "/api/auth/login", {
      email: "LEGADO@email.com",
      password: "senha-antiga-secreta",
    });

    assert.equal(response.status, 200);
    const row = srv.db.prepare("SELECT password_hash, password_legacy FROM users WHERE email = ?").get("legado@email.com");
    assert.ok(row.password_hash.startsWith("scrypt$"));
    assert.equal(row.password_legacy, null);
  });

  it("dois cadastros com a mesma senha geram hashes diferentes (salt)", async () => {
    const c = createClient(srv.baseUrl);
    await c.request("POST", "/api/auth/register", { email: "a1@email.com", password: "mesma-senha-123" });
    await c.request("POST", "/api/auth/register", { email: "a2@email.com", password: "mesma-senha-123" });
    const [h1, h2] = ["a1@email.com", "a2@email.com"].map(
      (email) => srv.db.prepare("SELECT password_hash h FROM users WHERE email = ?").get(email).h,
    );
    assert.notEqual(h1, h2);
  });

  it("rejeita e-mail duplicado (ignorando maiúsculas)", async () => {
    const c = createClient(srv.baseUrl);
    await c.request("POST", "/api/auth/register", { email: "dup@email.com", password: "senha-forte-1" });
    const r = await c.request("POST", "/api/auth/register", { email: "DUP@email.com", password: "outra-senha-1" });
    assert.equal(r.status, 409);
  });

  it("valida e-mail e tamanho da senha", async () => {
    const c = createClient(srv.baseUrl);
    assert.equal((await c.request("POST", "/api/auth/register", { email: "invalido", password: "senha-forte-1" })).status, 400);
    assert.equal((await c.request("POST", "/api/auth/register", { email: "ok@email.com", password: "curta" })).status, 400);
    assert.equal((await c.request("POST", "/api/auth/register", { email: "ok@email.com", password: "x".repeat(129) })).status, 400);
    assert.equal((await c.request("POST", "/api/auth/register", { email: ["a@b.com"], password: { $ne: 1 } })).status, 400);
  });

  it("login com senha errada ou e-mail inexistente dá a mesma resposta", async () => {
    const c = createClient(srv.baseUrl);
    await c.request("POST", "/api/auth/register", { email: "certo@email.com", password: "senha-forte-1" });
    const wrong = await c.request("POST", "/api/auth/login", { email: "certo@email.com", password: "senha-errada-1" });
    const ghost = await c.request("POST", "/api/auth/login", { email: "fantasma@email.com", password: "senha-forte-1" });
    assert.equal(wrong.status, 401);
    assert.equal(ghost.status, 401);
    assert.deepEqual(wrong.json, ghost.json);
    assert.equal(c.cookie, "");
  });

  it("rejeita cookie com token forjado", async () => {
    const response = await fetch(`${srv.baseUrl}/api/auth/me`, {
      headers: { Cookie: "cinenov_session=abc.def.ghi" },
    });
    assert.equal(response.status, 401);
  });

  it("JSON malformado devolve 400 sem vazar detalhes", async () => {
    const response = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{oops",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Requisição inválida." });
  });
});
