import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite"; // SQLite embutido no Node (22.13+): sem dependência nativa

const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

/** Abre (e cria, se preciso) o banco SQLite. Use ":memory:" nos testes. */
export function openDatabase(dbPath) {
  if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(schema);
  return db;
}

/** Acesso à tabela `users`: o único dado persistido pelo servidor. */
export function createUserStore(db) {
  const byEmail = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
  const byId = db.prepare("SELECT id, email FROM users WHERE id = ?");
  const insert = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");

  return {
    findByEmail: (email) => byEmail.get(email),
    findById: (id) => byId.get(id),
    create: (email, passwordHash) => ({ id: Number(insert.run(email, passwordHash).lastInsertRowid), email }),
  };
}

export function isUniqueViolation(err) {
  return err?.errcode === 2067 || /UNIQUE constraint failed/i.test(err?.message ?? "");
}
