import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ROOT_DIR } from "./config.js";
import { createUserStore } from "./db/index.js";
import { createRequireAuth } from "./middleware/requireAuth.js";
import { createAuthRouter } from "./routes/auth.js";
import { createMoviesRouter } from "./routes/movies.js";
import { createSessionService } from "./services/session.js";
import { TmdbError } from "./services/tmdb.js";

/** Monta o app Express. Recebe config/db/tmdb prontos, o que facilita os testes. */
export function createApp({ config, db, tmdb }) {
  const app = express();
  app.disable("x-powered-by");
  if (config.isProd) app.set("trust proxy", 1); // Render, Railway, Fly... ficam atrás de um proxy HTTPS

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "https://image.tmdb.org"],
          "upgrade-insecure-requests": config.isProd ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  const users = createUserStore(db);
  const session = createSessionService({ secret: config.jwtSecret, ttlSeconds: config.sessionTtlSeconds });
  const requireAuth = createRequireAuth({ session, users });

  app.use("/api/auth", createAuthRouter({ users, session, requireAuth, rateLimitMax: config.authRateLimitMax }));
  app.use("/api/movies", createMoviesRouter({ tmdb, requireAuth }));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Rota não encontrada." }));

  app.use(express.static(path.join(ROOT_DIR, "public")));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof TmdbError) return res.status(err.status).json({ error: err.message });
    if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
      return res.status(400).json({ error: "Requisição inválida." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno. Tente novamente em instantes." });
  });

  return app;
}
