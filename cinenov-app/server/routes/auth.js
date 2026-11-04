import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { isUniqueViolation } from "../db/index.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../services/password.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

function readCredentials(body) {
  return {
    email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : "",
    password: typeof body?.password === "string" ? body.password : "",
  };
}

function verifyLegacyPassword(password, legacyPassword) {
  if (typeof legacyPassword !== "string") return false;
  const candidate = Buffer.from(password, "utf8");
  const stored = Buffer.from(legacyPassword, "utf8");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function createAuthRouter({ users, session, requireAuth, rateLimitMax }) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
  });

  router.post("/register", limiter, async (req, res) => {
    const { email, password } = readCredentials(req.body);
    if (email.length > 254 || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Informe um e-mail válido." });
    }
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      return res.status(400).json({ error: `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.` });
    }

    if (await users.findByEmail(email)) {
      return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
    }

    try {
      await users.create(email, await hashPassword(password));
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
      }
      throw err;
    }

    res.status(201).json({ email });
  });

  router.post("/login", limiter, async (req, res) => {
    const { email, password } = readCredentials(req.body);
    if (!email || !password) return res.status(400).json({ error: "Informe e-mail e senha." });

    const user = await users.findByEmail(email);
    let valid = false;

    if (user?.password_hash) {
      valid = await verifyPassword(password, user.password_hash);
    } else if (user?.password_legacy != null) {
      valid = verifyLegacyPassword(password, user.password_legacy);
      if (valid) {
        // Migra a conta antiga no primeiro login correto e apaga a senha em texto puro.
        await users.updatePasswordHash(user.id, await hashPassword(password));
      } else {
        await verifyPassword(password, DUMMY_HASH);
      }
    } else {
      // Mantém custo semelhante quando o e-mail não existe ou a conta não tem credencial.
      await verifyPassword(password, DUMMY_HASH);
    }

    if (!user || !valid) return res.status(401).json({ error: "E-mail ou senha incorretos." });

    session.issue(res, req, user);
    res.json({ email: user.email });
  });

  router.post("/logout", (req, res) => {
    session.clear(res, req);
    res.status(204).end();
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ email: req.user.email });
  });

  return router;
}
