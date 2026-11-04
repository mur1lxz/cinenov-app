import "dotenv/config";
import { createProductionApp } from "./production.js";

const app = createProductionApp();
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`CineNov rodando em http://localhost:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
