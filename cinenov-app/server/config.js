import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Lê e valida as variáveis de ambiente. Recebe `env` para facilitar os testes.
 */
export function loadConfig(env = process.env) {
  const isProd = env.NODE_ENV === "production";

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProd) {
      throw new Error("JWT_SECRET é obrigatório em produção (use pelo menos 32 caracteres aleatórios).");
    }
    jwtSecret = randomBytes(32).toString("hex");
    console.warn("[config] JWT_SECRET não definido: usando um segredo temporário (as sessões caem ao reiniciar).");
  } else if (isProd && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres em produção.");
  }

  return {
    isProd,
    port: Number(env.PORT) || 3000,
    dbPath: env.DB_PATH || path.join(ROOT_DIR, "data", "cinenov.db"),
    jwtSecret,
    tmdbApiKey: (env.TMDB_API_KEY || "").trim(),
    sessionTtlSeconds: 60 * 60 * 24 * 7, // 7 dias
    authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX) || 20, // tentativas por IP a cada 15 min
  };
}
