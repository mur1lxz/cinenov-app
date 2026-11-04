/** Bloqueia a rota se não houver sessão válida de um usuário que ainda exista no banco. */
export function createRequireAuth({ session, users }) {
  return function requireAuth(req, res, next) {
    const id = session.read(req);
    const user = id ? users.findById(id) : null;
    if (!user) return res.status(401).json({ error: "Não autenticado." });
    req.user = user;
    next();
  };
}
