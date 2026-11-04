import "dotenv/config";
import { createProductionApp } from "./server/production.js";

// A Vercel função serverless recebe o app Express exportado por padrão.
const app = createProductionApp();

export default app;
