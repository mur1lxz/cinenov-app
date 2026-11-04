/** Bloqueia a rota se não houver sessão válida de um usuário que ainda exista no banco. */
export function createRequireAuth({ session, users }) {
  return async function requireAuth(req, res, next) {
    try {
      const id = session.read(req);
      const user = id ? await users.findById(id) : null;
      if (!user) return res.status(401).json({ error: "Não autenticado." });
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
