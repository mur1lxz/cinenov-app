import "dotenv/config";

// O banco usa o SQLite embutido no Node, que exige a versão 22.13 ou superior.
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`\n[node] O CineNov precisa do Node 22.13 ou superior (você está no ${process.versions.node}).\n`);
  process.exit(1);
}

const { createApp } = await import("./app.js");
const { loadConfig } = await import("./config.js");
const { openDatabase } = await import("./db/index.js");
const { createTmdbService } = await import("./services/tmdb.js");

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`\n[config] ${err.message}\n`);
  process.exit(1);
}

const db = openDatabase(config.dbPath);
const tmdb = createTmdbService({ apiKey: config.tmdbApiKey });
const app = createApp({ config, db, tmdb });

if (!config.tmdbApiKey) {
  console.warn("[tmdb] TMDB_API_KEY não definida: o login funciona, mas a lista de filmes não vai carregar.");
}

const server = app.listen(config.port, () => {
  console.log(`CineNov rodando em http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = app;