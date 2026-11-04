-- O banco guarda SOMENTE o necessário para o login.
-- A senha nunca é salva em texto puro: apenas o hash (scrypt + salt aleatório).
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
