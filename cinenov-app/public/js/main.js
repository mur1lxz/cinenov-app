import { api } from "./api.js";
import { loadFavorites, saveFavorites } from "./favorites.js";
import { cardHTML, esc, heartIcon } from "./render.js";
import { filterMovies } from "./search.js";

const $ = (selector) => document.querySelector(selector);
const toggle = (el, visible) => el.classList.toggle("hidden", !visible);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

const VIEWS = {
  now: { title: "Em <span>Cartaz</span>", endpoint: "now-playing" },
  upcoming: { title: "Em <span>Breve</span>", endpoint: "upcoming" },
  favorites: { title: "Meus <span>Favoritos</span>" },
};

const state = {
  user: null,
  mode: "login", // "login" | "signup"
  view: "now",
  query: "",
  favorites: [],
  movies: {}, // cache por seção: { now: [...], upcoming: [...] }
  renderId: 0, // descarta respostas de renders antigos
};

// Versões antigas do app guardavam contas e senhas em texto puro no navegador. Limpa isso.
try {
  localStorage.removeItem("cinenov_users");
  localStorage.removeItem("cinenov_session");
} catch {
  /* localStorage indisponível */
}

/* ------------------------------ Login / cadastro ------------------------------ */

function showMessage(text, ok = false) {
  const el = $("#auth-msg");
  el.textContent = text;
  el.classList.toggle("ok", ok);
}

function setMode(mode) {
  state.mode = mode;
  const signup = mode === "signup";
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  toggle($("#confirm-wrap"), signup);
  $("#auth-submit").textContent = signup ? "Criar Conta" : "Entrar";
  $("#password").autocomplete = signup ? "new-password" : "current-password";
  $("#password").placeholder = signup ? `Mínimo ${PASSWORD_MIN} caracteres` : "••••••••";
  showMessage("");
}

function showLogin() {
  state.user = null;
  state.favorites = [];
  state.movies = {};
  state.query = "";
  toggle($("#app-view"), false);
  toggle($("#login-view"), true);
  $("#auth-form").reset();
  setMode("login");
}

document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("#email").value.trim().toLowerCase();
  const password = $("#password").value;
  const signup = state.mode === "signup";

  if (!EMAIL_RE.test(email)) return showMessage("Informe um e-mail válido.");
  if (signup) {
    if (password.length < PASSWORD_MIN) return showMessage(`A senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`);
    if (password !== $("#confirm").value) return showMessage("As senhas não coincidem.");
  } else if (!password) {
    return showMessage("Informe a senha.");
  }

  const submit = $("#auth-submit");
  submit.disabled = true;
  try {
    if (signup) {
      await api.register(email, password);
      setMode("login");
      $("#password").value = "";
      $("#confirm").value = "";
      showMessage("Conta criada! Faça login para continuar.", true);
    } else {
      const user = await api.login(email, password);
      enterApp(user.email);
    }
  } catch (err) {
    showMessage(err.message);
  } finally {
    submit.disabled = false;
  }
});

$("#logout").addEventListener("click", async () => {
  await api.logout().catch(() => {});
  showLogin();
});

function expireSession() {
  showLogin();
  showMessage("Sua sessão expirou. Entre novamente.");
}

/* ----------------------------------- Busca ----------------------------------- */

function setQuery(value) {
  state.query = value;
  toggle($("#search-clear"), value.length > 0);
  render({ animate: false });
}

$("#search-input").addEventListener("input", (e) => setQuery(e.target.value));
$("#search-input").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.target.value = "";
    setQuery("");
  }
});
$("#search-clear").addEventListener("click", () => {
  $("#search-input").value = "";
  setQuery("");
  $("#search-input").focus();
});
$("#search").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#search-input").blur(); // fecha o teclado no celular
});

/* ------------------------------------ App ------------------------------------ */

function enterApp(email) {
  state.user = email;
  state.favorites = loadFavorites(email);
  state.view = "now";
  state.query = "";
  $("#search-input").value = "";
  toggle($("#search-clear"), false);
  $("#user-email").textContent = email;
  toggle($("#login-view"), false);
  toggle($("#app-view"), true);
  render();
}

document.querySelectorAll(".nav-link").forEach((link) =>
  link.addEventListener("click", () => {
    state.view = link.dataset.view;
    render();
  }),
);

function setStatus(html) {
  $("#grid").innerHTML = html;
  toggle($("#empty"), false);
  $("#results-info").textContent = "";
}

async function render({ animate = true } = {}) {
  const renderId = ++state.renderId;
  const view = VIEWS[state.view];
  const grid = $("#grid");

  $("#fav-count").textContent = state.favorites.length;
  $("#section-title").innerHTML = view.title;
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.view === state.view));
  toggle($("#search"), state.view === "now");

  let list;
  if (state.view === "favorites") {
    list = state.favorites;
  } else {
    if (!state.movies[state.view]) {
      setStatus(`<p class="status">Carregando filmes…</p>`);
      try {
        state.movies[state.view] = await api.movies(view.endpoint);
      } catch (err) {
        if (renderId !== state.renderId) return;
        if (err.status === 401) return expireSession();
        return setStatus(
          `<div class="status"><p>${esc(err.message)}</p><button type="button" class="btn-ghost" data-retry>Tentar novamente</button></div>`,
        );
      }
      if (renderId !== state.renderId) return;
    }
    list = state.movies[state.view];
  }

  const searching = state.view === "now" && state.query.trim() !== "";
  if (searching) list = filterMovies(list, state.query);

  grid.classList.toggle("animate", animate);
  grid.innerHTML = list.map((movie, index) => cardHTML(movie, { index, favorite: isFavorite(movie.id) })).join("");

  const info = $("#results-info");
  info.textContent = searching
    ? `${list.length} ${list.length === 1 ? "filme encontrado" : "filmes encontrados"} para “${state.query.trim()}”`
    : "";

  const empty = $("#empty");
  if (list.length === 0) {
    empty.textContent = searching
      ? `Nenhum filme em cartaz encontrado para “${state.query.trim()}”.`
      : state.view === "favorites"
        ? "Nenhum filme favoritado ainda. Toque no ♥ de um pôster."
        : "Nenhum filme disponível no momento.";
  }
  toggle(empty, list.length === 0);
}

/* --------------------------------- Favoritos --------------------------------- */

const isFavorite = (id) => state.favorites.some((f) => f.id === id);

function findMovie(id) {
  return [...(state.movies.now || []), ...(state.movies.upcoming || []), ...state.favorites].find((m) => m.id === id);
}

$("#grid").addEventListener("click", (event) => {
  if (event.target.closest("[data-retry]")) return render();

  const button = event.target.closest(".fav-btn");
  if (!button) return;
  const id = Number(button.dataset.id);
  const movie = findMovie(id);
  if (!movie) return;

  const wasFavorite = isFavorite(id);
  state.favorites = wasFavorite ? state.favorites.filter((f) => f.id !== id) : [...state.favorites, movie];
  saveFavorites(state.user, state.favorites);
  $("#fav-count").textContent = state.favorites.length;

  if (state.view === "favorites") return render({ animate: false });
  button.classList.toggle("active", !wasFavorite);
  button.textContent = heartIcon(!wasFavorite);
  button.setAttribute("aria-pressed", String(!wasFavorite));
  button.setAttribute("aria-label", `${wasFavorite ? "Adicionar aos" : "Remover dos"} favoritos`);
});

// Pôster que não carregou: cai para o título em texto (o evento "error" não borbulha, por isso captura).
$("#grid").addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const poster = img.closest(".poster");
    const title = img.alt.replace(/^Pôster de /, "");
    poster.classList.add("no-poster");
    img.replaceWith(Object.assign(document.createElement("span"), { className: "poster-title", textContent: title }));
  },
  true,
);

/* ------------------------------------ Boot ----------------------------------- */

(async function boot() {
  try {
    const user = await api.me();
    enterApp(user.email);
  } catch {
    showLogin();
  }
})();
