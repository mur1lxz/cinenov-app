import { Router } from "express";

export function createMoviesRouter({ tmdb, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.get("/now-playing", async (_req, res) => res.json({ results: await tmdb.nowPlaying() }));
  router.get("/upcoming", async (_req, res) => res.json({ results: await tmdb.upcoming() }));

  return router;
}
