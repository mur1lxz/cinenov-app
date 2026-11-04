import jwt from "jsonwebtoken";

export const COOKIE_NAME = "cinenov_session";

/** Sessão sem estado: um JWT assinado num cookie httpOnly. Nada de sessão no banco. */
export function createSessionService({ secret, ttlSeconds }) {
  return {
    issue(res, req, user) {
      const token = jwt.sign({ email: user.email }, secret, {
        subject: String(user.id),
        expiresIn: ttlSeconds,
        algorithm: "HS256",
      });
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: req.secure, // true automaticamente atrás de HTTPS (trust proxy)
        maxAge: ttlSeconds * 1000,
        path: "/",
      });
    },
    clear(res, req) {
      res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: req.secure, path: "/" });
    },
    /** Retorna o id do usuário ou null se o token for inválido/expirado. */
    read(req) {
      const token = req.cookies?.[COOKIE_NAME];
      if (!token) return null;
      try {
        const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
        const id = Number(payload.sub);
        return Number.isInteger(id) ? id : null;
      } catch {
        return null;
      }
    },
  };
}
