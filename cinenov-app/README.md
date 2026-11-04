# 🎬 CineNov

Catálogo de filmes **em cartaz** e **em breve** nos cinemas do Brasil, com cadastro, login, busca e favoritos.

## Funcionalidades

- Cadastro e login com sessão em cookie httpOnly.
- Senhas armazenadas somente como hash scrypt + salt aleatório.
- Filmes em cartaz e próximos lançamentos fornecidos pelo TMDB.
- Busca por título em cartaz, ignorando acentos e maiúsculas.
- Favoritos salvos no navegador e separados por conta.
- Front-end estático em HTML, CSS e JavaScript, servido pelo Express.

## Tecnologias

- Node.js 22.13 ou superior
- Express 5
- Supabase PostgreSQL para persistir as contas
- TMDB API para os dados dos filmes
- Vercel para hospedagem

## Estrutura

```
cinenov-app/
├── index.js                 # entrada Express reconhecida pela Vercel
├── vercel.json              # preset Express, sem rewrites manuais
├── server/
│   ├── index.js             # inicialização local
│   ├── production.js         # configuração dos serviços reais
│   ├── app.js                # rotas, segurança e arquivos estáticos
│   ├── config.js             # validação das variáveis de ambiente
│   ├── db/
│   │   ├── index.js          # acesso ao Supabase
│   │   └── schema.sql        # estrutura PostgreSQL
│   ├── routes/               # autenticação e filmes
│   ├── services/             # sessão, senha e TMDB
│   └── middleware/
├── public/                   # HTML, CSS e JavaScript do navegador
├── test/                     # testes automatizados
├── test-utils/
└── package.json
```

## Configuração do Supabase

1. Crie ou abra um projeto em [Supabase](https://supabase.com/dashboard).
2. No projeto, abra **SQL Editor**.
3. Copie e execute o conteúdo de `server/db/schema.sql`.
4. Em **Project Settings → API**, copie a Project URL e a chave secreta do projeto. A chave legada `service_role` também é aceita.
5. Mantenha a chave secreta somente nas variáveis de ambiente do servidor. Nunca a coloque em arquivos dentro de `public/` ou em variáveis `VITE_*`.

O banco usa a tabela `public.users`. O script habilita RLS e concede acesso de leitura e inserção ao papel de servidor `service_role`; a chave administrativa não deve ser exposta ao navegador.

> Se você já criou uma tabela `users` com uma coluna `password` (senha em texto puro), não a reutilize sem migrar as contas. O código atual exige `password_hash` com hashes scrypt. Para um banco de testes sem contas importantes, remova a tabela antiga e execute o script atualizado. Não publique nem compartilhe a chave secreta do Supabase.

## Executar localmente

Requisitos: Node.js 22.13 ou superior e uma conta Supabase configurada.

```bash
npm install
cp .env.example .env
```

Preencha o arquivo `.env`:

| Variável | Obrigatória | Finalidade |
|---|---|---|
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SECRET_KEY` | Sim | Chave secreta do servidor (ou `SUPABASE_SERVICE_ROLE_KEY` legada) |
| `JWT_SECRET` | Sim em produção | Segredo aleatório com pelo menos 32 caracteres |
| `TMDB_API_KEY` | Para carregar filmes | Chave da API TMDB |
| `PORT` | Não | Porta local (padrão 3000) |
| `NODE_ENV` | Não | Use `development` localmente e `production` na Vercel |

Gere o segredo de sessão com:

```bash
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(48).toString('base64url'))"
```

Inicie o projeto:

```bash
npm start
```

Acesse http://localhost:3000. Para executar os testes:

```bash
npm test
```

Os testes de autenticação usam SQLite em memória e não precisam de uma conta Supabase.

## Publicar na Vercel

1. Importe o repositório `mur1lxz/cinenov-app` na Vercel.
2. Em **Project Settings → Build and Deployment**, configure **Root Directory** como `cinenov-app` (a pasta interna do repositório).
3. Use o Framework Preset **Express**. O arquivo `vercel.json` declara esse preset; não configure rewrites ou builders manuais.
4. Em **Project Settings → Environment Variables**, adicione:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY` se estiver usando a chave legada)
   - `JWT_SECRET`
   - `TMDB_API_KEY`
   - `NODE_ENV` com valor `production`
5. Salve e faça um novo deploy.

A entrada `index.js` exporta a aplicação Express. O front-end é servido pela pasta `public/`; as rotas da API ficam em `/api`. O endpoint `/api/health` permite verificar se a função está respondendo.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Verifica se a aplicação está respondendo |
| POST | `/api/auth/register` | Cria conta com senha em hash |
| POST | `/api/auth/login` | Inicia a sessão |
| POST | `/api/auth/logout` | Encerra a sessão |
| GET | `/api/auth/me` | Retorna o usuário autenticado |
| GET | `/api/movies/now-playing` | Filmes em cartaz (exige login) |
| GET | `/api/movies/upcoming` | Próximos lançamentos (exige login) |

## Segurança

- Senhas com scrypt e salt aleatório; a senha original não é armazenada.
- Sessões em cookie httpOnly, SameSite=Lax e Secure em HTTPS.
- Limite de tentativas de login e cadastro por IP.
- Segredo JWT e chave Supabase mantidos no ambiente do servidor.
- A tabela Supabase tem RLS habilitado; o acesso administrativo ocorre somente no backend.
