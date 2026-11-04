// Favoritos ficam no navegador (localStorage), separados por e-mail.
const key = (email) => `cinenov_favs_${email}`;

export function loadFavorites(email) {
  try {
    const list = JSON.parse(localStorage.getItem(key(email)));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFavorites(email, list) {
  try {
    localStorage.setItem(key(email), JSON.stringify(list));
  } catch {
    /* armazenamento cheio ou bloqueado: segue sem persistir */
  }
}
