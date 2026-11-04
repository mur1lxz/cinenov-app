# 🎬 CineNov

Catálogo de filmes **em cartaz** e **em breve** nos cinemas do Brasil, com conta de usuário, busca e favoritos.

- **Login real:** cadastro e login com banco de dados. O banco guarda **somente** e-mail e o *hash* da senha (scrypt + salt), nunca a senha em texto puro.
- **Lupa de busca** nos filmes em cartaz: ignora acentos e maiúsculas, aceita várias palavras e também encontra pelo título original.
- **Favoritos** salvos no navegador, separados por conta.
- **Dados do [TMDB](https://www.themoviedb.org/):** a chave da API fica só no servidor, nunca no navegador.

## Estrutura

```
cinenov/
├── server/
│   ├── index.js              # ponto de entrada (sobe o servidor)
│   ├── app.js                # monta o Express (segurança, rotas, estáticos)
│   ├── config.js             # lê e valida o .env
│   ├── db/
│   │   ├── schema.sql        # a única tabela: users (email + password_hash)
│   │   └── index.js          # conexão SQLite (embutido no Node) + acesso a users
│   ├── routes/
│   │   ├── auth.js           # /api/auth: register, login, logout, me
│   │   └── movies.js         # /api/movies: now-playing, upcoming
│   ├── services/
│   │   ├── password.js       # hash e verificação de senha (scrypt)
│   │   ├── session.js        # sessão via JWT em cookie httpOnly
│   │   └── tmdb.js           # cliente do TMDB com cache de 30 min
│   └── middleware/requireAuth.js
├── public/                   # front-end (HTML + CSS + JS puro, sem build)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── main.js           # telas, login, navegação, busca
│       ├── api.js            # chamadas ao servidor
│       ├── search.js         # lógica da lupa (filtro sem acentos)
│       ├── favorites.js      # favoritos no localStorage
│       └── render.js         # HTML dos cards
├── test/ e test-utils/       # testes automatizados
├── data/                     # o arquivo do banco SQLite é criado aqui
├── .env.example
└── package.json
```

## Como rodar

Requisitos: **Node.js 22.13 ou superior** (o banco usa o SQLite que já vem dentro do Node, então não precisa instalar nem compilar nada extra).

```bash
npm install
cp .env.example .env     # depois edite o .env (veja abaixo)
npm start
```

Abra http://localhost:3000.

No `.env`, preencha:

| Variável | Para quê |
|---|---|
| `TMDB_API_KEY` | Chave gratuita do TMDB (https://www.themoviedb.org/settings/api). Sem ela o login funciona, mas os filmes não carregam. |
| `JWT_SECRET` | Segredo da sessão. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

Outros comandos: `npm run dev` (reinicia ao editar) e `npm test`.

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria conta (`email`, `password` de 8 a 128 caracteres) |
| POST | `/api/auth/login` | Entra e define o cookie de sessão |
| POST | `/api/auth/logout` | Encerra a sessão |
| GET | `/api/auth/me` | Quem está logado |
| GET | `/api/movies/now-playing` | Filmes em cartaz (exige login) |
| GET | `/api/movies/upcoming` | Próximos lançamentos (exige login) |

## Segurança

- Senhas com **scrypt** e salt aleatório; comparação em tempo constante.
- Sessão em cookie **httpOnly** + `SameSite=Lax` (e `Secure` automaticamente em HTTPS); JavaScript da página não lê o cookie.
- Limite de tentativas nas rotas de login/cadastro (20 por IP a cada 15 min).
- Login com e-mail inexistente e com senha errada têm a mesma resposta e o mesmo tempo.
- Cabeçalhos de segurança e CSP via Helmet; HTML dos cards é escapado.

## Publicar (deploy)

O app precisa de um servidor Node. O **GitHub Pages não serve**, porque ele só hospeda arquivos estáticos. Serviços como Render, Railway ou Fly.io funcionam:

1. Defina `NODE_ENV=production`, `JWT_SECRET` e `TMDB_API_KEY` nas variáveis de ambiente do serviço.
2. Comando de build: `npm install`. Comando de start: `npm start`.
3. O banco é um arquivo SQLite: use um **disco persistente** e aponte `DB_PATH` para ele, senão as contas somem a cada deploy.
