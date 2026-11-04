import "dotenv/config";
import express from "express";
import { createProductionApp } from "./server/production.js";

// Vercel reconhece este arquivo na raiz como a entrada da aplicação Express.
const app = express();
app.use(createProductionApp());

export default app;
