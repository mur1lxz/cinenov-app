import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Lê e valida as variáveis de ambiente utilizadas pelo CineNov.
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

  const supabaseUrl = (env.SUPABASE_URL || "").trim();
  const supabaseKey = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  return {
    isProd,
    port: Number(env.PORT) || 3000,
    jwtSecret,
    tmdbApiKey: (env.TMDB_API_KEY || "").trim(),
    supabaseUrl,
    supabaseKey,
    sessionTtlSeconds: 60 * 60 * 24 * 7,
    authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX) || 20,
  };
}
