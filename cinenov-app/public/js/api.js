export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor.");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || "Algo deu errado. Tente novamente.");
  return data;
}

export const api = {
  me: () => request("GET", "/api/auth/me"),
  register: (email, password) => request("POST", "/api/auth/register", { email, password }),
  login: (email, password) => request("POST", "/api/auth/login", { email, password }),
  logout: () => request("POST", "/api/auth/logout"),
  /** @param {"now-playing"|"upcoming"} endpoint */
  movies: (endpoint) => request("GET", `/api/movies/${endpoint}`).then((d) => d.results),
};
