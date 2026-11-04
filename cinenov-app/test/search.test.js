import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterMovies, normalize } from "../public/js/search.js";

const movies = [
  { id: 1, title: "Duna: Parte Três", original_title: "Dune: Part Three" },
  { id: 2, title: "Ação Explosiva", original_title: "Big Action" },
  { id: 3, title: "O Último Verão", original_title: "The Last Summer" },
];
const ids = (list) => list.map((m) => m.id);

describe("busca de filmes em cartaz", () => {
  it("ignora acentos e maiúsculas", () => {
    assert.deepEqual(ids(filterMovies(movies, "acao")), [2]);
    assert.deepEqual(ids(filterMovies(movies, "ÚLTIMO")), [3]);
    assert.deepEqual(ids(filterMovies(movies, "tres")), [1]);
  });
  it("também encontra pelo título original", () => {
    assert.deepEqual(ids(filterMovies(movies, "dune")), [1]);
    assert.deepEqual(ids(filterMovies(movies, "last summer")), [3]);
  });
  it("exige todas as palavras digitadas, em qualquer ordem", () => {
    assert.deepEqual(ids(filterMovies(movies, "parte duna")), [1]);
    assert.deepEqual(ids(filterMovies(movies, "duna verão")), []);
  });
  it("busca vazia devolve tudo e sem resultado devolve lista vazia", () => {
    assert.equal(filterMovies(movies, "   ").length, 3);
    assert.equal(filterMovies(movies, "zzz").length, 0);
  });
  it("normalize tolera valores nulos", () => {
    assert.equal(normalize(null), "");
    assert.equal(normalize("  Ção "), "cao");
  });
});
