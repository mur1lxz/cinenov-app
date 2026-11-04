import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createSupabaseClient, createUserStore } from "./db/index.js";
import { createTmdbService } from "./services/tmdb.js";

/** Monta a aplicação com os serviços reais a partir das variáveis de ambiente. */
export function createProductionApp(env = process.env) {
  const config = loadConfig(env);
  const supabase = createSupabaseClient({
    url: config.supabaseUrl,
    key: config.supabaseKey,
  });
  const users = createUserStore(supabase);
  const tmdb = createTmdbService({ apiKey: config.tmdbApiKey });

  if (!config.tmdbApiKey) {
    console.warn("[tmdb] TMDB_API_KEY não definida: a página abre, mas os filmes não serão carregados.");
  }

  return createApp({ config, users, tmdb });
}
