import express from "express";
import "dotenv/config";
import { createProductionApp } from "./server/production.js";

const app = createProductionApp();

export default app;
