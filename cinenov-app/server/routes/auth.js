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
    if (users.findByEmail(email)) {
      return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
    }
    try {
      users.create(email, await hashPassword(password));
    } catch (err) {
      if (isUniqueViolation(err)) return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
      throw err;
    }
    res.status(201).json({ email });
  });

  router.post("/login", limiter, async (req, res) => {
    const { email, password } = readCredentials(req.body);
    if (!email || !password) return res.status(400).json({ error: "Informe e-mail e senha." });

    const user = users.findByEmail(email);
    const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
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
