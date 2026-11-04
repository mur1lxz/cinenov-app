# 🎬 CineNov

Aplicação web para descobrir filmes em cartaz e próximos lançamentos nos cinemas do Brasil. O projeto reúne catálogo de filmes, busca por título, cadastro, login e lista de favoritos.

🌐 **Aplicação publicada:** https://cinenov-app.vercel.app  
📦 **Repositório:** https://github.com/mur1lxz/cinenov-app

---

## ✨ Funcionalidades

- **Cadastro e login:** criação de conta e autenticação por e-mail e senha.
- **Sessão protegida:** sessão mantida por cookie HTTP-only assinado com JWT.
- **Em cartaz:** consulta de filmes atualmente em cartaz no Brasil.
- **Em breve:** consulta de próximos lançamentos.
- **Busca:** filtro de filmes em cartaz pelo título em português ou pelo título original. A busca ignora acentos e diferenças entre letras maiúsculas e minúsculas.
- **Favoritos:** permite adicionar e remover filmes da lista de favoritos.
- **Interface responsiva:** estrutura em HTML, CSS e JavaScript, com navegação entre as seções.
- **Cache no servidor:** resultados do TMDB são armazenados temporariamente em memória para reduzir chamadas repetidas à API.

> Os favoritos ficam no armazenamento local do navegador (localStorage), separados por conta/e-mail. Eles não são sincronizados entre dispositivos nem armazenados no banco de dados.

## 🖥️ Demonstração

Acesse a aplicação: **[cinenov-app.vercel.app](https://cinenov-app.vercel.app)**

Para utilizar o catálogo, crie uma conta ou entre com uma conta já cadastrada.

## 🧰 Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e layout responsivo |
| JavaScript | Interações e lógica do front-end |
| Node.js | Ambiente de execução do servidor |
| Express 5 | Servidor HTTP e rotas da aplicação |
| Supabase / PostgreSQL | Persistência das contas de usuários |
| TMDB API | Dados dos filmes e lançamentos |
| JSON Web Token (JWT) | Assinatura da sessão |
| Vercel | Hospedagem e deploy |

## 🏗️ Como o projeto funciona

O CineNov é dividido em duas partes principais:

### Front-end

A pasta **cinenov-app/public** contém a interface que o usuário acessa pelo navegador:

- **index.html:** estrutura da tela de login, cadastro e catálogo.
- **css/style.css:** estilos da aplicação.
- **js/main.js:** controla a navegação, autenticação, busca, renderização e favoritos.
- **js/api.js:** centraliza as requisições para o servidor.
- **js/favorites.js:** salva e recupera favoritos no navegador.
- **js/search.js:** normaliza e filtra os títulos.
- **js/render.js:** monta os cartões dos filmes.

O navegador não chama o TMDB diretamente. Ele faz requisições às rotas internas do CineNov.

### Back-end

A pasta **cinenov-app/server** contém a aplicação Express:

- Recebe as requisições do front-end.
- Valida cadastro e login.
- Consulta e grava os usuários no Supabase.
- Cria e valida a sessão do usuário.
- Consulta os filmes na API do TMDB.
- Protege as rotas de filmes para permitir acesso somente a usuários autenticados.

### Fluxo simplificado

1. O visitante abre o CineNov e cria uma conta ou faz login.
2. O servidor valida os dados e consulta a tabela de usuários no Supabase.
3. Após o login, o servidor envia um cookie de sessão protegido.
4. O front-end solicita os filmes às rotas **/api/movies**.
5. O back-end consulta o TMDB e devolve os dados necessários para a interface.
6. O usuário pode pesquisar os filmes em cartaz e salvar favoritos no navegador.

## 📁 Estrutura de pastas

O código da aplicação fica na pasta interna **cinenov-app/** do repositório.

~~~text
cinenov-app/
├── .env.example
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
├── vercel.json
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── favorites.js
│       ├── main.js
│       ├── render.js
│       └── search.js
├── server/
│   ├── app.js
│   ├── config.js
│   ├── index.js
│   ├── production.js
│   ├── db/
│   │   ├── index.js
│   │   └── schema.sql
│   ├── middleware/
│   │   └── requireAuth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── movies.js
│   └── services/
│       ├── password.js
│       ├── session.js
│       └── tmdb.js
├── test/
│   ├── auth.test.js
│   ├── movies.test.js
│   └── search.test.js
└── test-utils/
    └── helpers.js
~~~

## ⚙️ Configuração e execução local

### Requisitos

- Node.js **22.13 ou superior**.
- npm.
- Projeto no Supabase.
- Chave de API do TMDB.

### 1. Clonar o repositório

~~~bash
git clone https://github.com/mur1lxz/cinenov-app.git
cd cinenov-app/cinenov-app
~~~

### 2. Instalar as dependências

~~~bash
npm install
~~~

### 3. Criar o arquivo de ambiente

Copie o arquivo de exemplo:

**Windows PowerShell:**

~~~powershell
Copy-Item .env.example .env
~~~

**Linux / macOS:**

~~~bash
cp .env.example .env
~~~

Abra o arquivo **.env** e configure as variáveis descritas abaixo. O arquivo **.env** contém informações privadas e não deve ser enviado ao GitHub.

### 4. Configurar as variáveis

| Variável | Obrigatória | Descrição |
|---|---:|---|
| **SUPABASE_URL** | Sim | URL do projeto Supabase, no formato https://SEU-PROJETO.supabase.co. |
| **SUPABASE_SECRET_KEY** | Sim | Chave secreta do Supabase usada exclusivamente pelo servidor. |
| **TMDB_API_KEY** | Para carregar filmes | Chave de API **v3** do TMDB. |
| **JWT_SECRET** | Sim em produção | Segredo aleatório com pelo menos 32 caracteres para assinar as sessões. |
| **NODE_ENV** | Recomendada | Use development localmente e production na Vercel. |
| **PORT** | Não | Porta local do servidor. O padrão é 3000. |

O projeto também reconhece os nomes antigos **SUPABASE_SERVICE_ROLE_KEY** e **SUPABASE_KEY** como alternativas para a chave do Supabase. Dê preferência a **SUPABASE_SECRET_KEY**.

Exemplo de configuração (preencha os valores somente no seu arquivo **.env**):

~~~dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=
TMDB_API_KEY=
JWT_SECRET=
~~~

**Não coloque valores reais de chaves neste README, no código do navegador ou em repositórios públicos.**

### 5. Gerar o segredo JWT

No terminal, dentro da pasta do projeto, execute:

~~~bash
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(48).toString('base64url'))"
~~~

Copie o resultado para **JWT_SECRET**. Use um segredo próprio e mantenha-o privado.

### 6. Preparar o banco no Supabase

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra o **SQL Editor** do projeto.
3. Abra o arquivo **server/db/schema.sql** neste repositório.
4. Copie o conteúdo do script e execute no SQL Editor.
5. Em **Project Settings → API**, obtenha a URL do projeto e a chave secreta.
6. Coloque esses valores em **SUPABASE_URL** e **SUPABASE_SECRET_KEY** no ambiente do servidor.

O script cria a tabela **public.users**, adiciona as colunas necessárias para as credenciais e habilita RLS (Row Level Security). O acesso à tabela é feito pelo servidor usando a chave administrativa. **Não desative o RLS e nunca exponha a chave secreta no front-end.**

Se estiver migrando uma instalação antiga que armazenava senhas em uma coluna chamada **password**, leia os comentários de **server/db/schema.sql** e faça backup do banco antes de executar a migração. O projeto migra credenciais antigas para hash scrypt no primeiro login válido.

### 7. Obter a chave do TMDB

1. Crie uma conta no [The Movie Database (TMDB)](https://www.themoviedb.org/).
2. Acesse as configurações da conta e abra a seção **API**.
3. Solicite/consulte a **Chave de API (v3 auth)**.
4. Coloque somente o valor da chave na variável **TMDB_API_KEY**.

O serviço atual envia essa chave no parâmetro **api_key** das requisições ao TMDB. Portanto, use a **Chave de API**, não o Token de leitura da API v4. Não adicione **Bearer**, aspas ou o texto **TMDB** junto ao valor.

Documentação: [TMDB API](https://developer.themoviedb.org/docs).

### 8. Iniciar a aplicação

~~~bash
npm start
~~~

A aplicação ficará disponível em:

~~~text
http://localhost:3000
~~~

Para iniciar em modo de desenvolvimento, com reinicialização automática:

~~~bash
npm run dev
~~~

## 🧪 Testes

Execute os testes automatizados com:

~~~bash
npm test
~~~

Os testes utilizam o executor de testes nativo do Node.js e cobrem os fluxos de autenticação, filmes e busca. Os testes não substituem a validação das credenciais e da configuração do Supabase/TMDB em produção.

## 🔌 Rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | **/api/health** | Público | Verifica se a aplicação está respondendo. |
| POST | **/api/auth/register** | Público | Cria uma conta. |
| POST | **/api/auth/login** | Público | Autentica o usuário e inicia a sessão. |
| POST | **/api/auth/logout** | Sessão | Encerra a sessão. |
| GET | **/api/auth/me** | Sessão | Retorna o e-mail do usuário autenticado. |
| GET | **/api/movies/now-playing** | Sessão | Retorna filmes em cartaz. |
| GET | **/api/movies/upcoming** | Sessão | Retorna próximos lançamentos. |

As rotas de filmes exigem autenticação. As rotas de cadastro e login recebem e devolvem dados em JSON.

## 🔐 Segurança

O projeto adota algumas medidas de segurança no servidor:

- Senhas novas são armazenadas com hash **scrypt** e salt aleatório, não em texto puro.
- A sessão usa JWT assinado e cookie **httpOnly**, com configurações **SameSite=Lax** e **Secure** em HTTPS.
- As rotas de filmes verificam se a sessão é válida e se o usuário ainda existe no banco.
- Cadastro e login possuem limitação de tentativas.
- O middleware Helmet adiciona cabeçalhos de segurança.
- A chave secreta do Supabase, a chave do TMDB e o segredo JWT são lidos de variáveis de ambiente no servidor.
- O arquivo **.env** e arquivos locais de dados são ignorados pelo Git.

**Nunca publique:** .env, SUPABASE_SECRET_KEY, JWT_SECRET, TMDB_API_KEY, tokens ou credenciais de acesso. Se uma chave for exposta, revogue-a e gere outra.

## 🚀 Deploy na Vercel

O CineNov está preparado para deploy na Vercel usando o adaptador Express.

1. Importe o repositório [mur1lxz/cinenov-app](https://github.com/mur1lxz/cinenov-app) na [Vercel](https://vercel.com/).
2. Abra **Project Settings → Build and Deployment**.
3. Configure **Root Directory** como **cinenov-app** (a pasta interna do repositório).
4. Utilize o Framework Preset **Express**.
5. Em **Settings → Environment Variables**, configure as variáveis necessárias:

   - **SUPABASE_URL**
   - **SUPABASE_SECRET_KEY**
   - **JWT_SECRET**
   - **TMDB_API_KEY**
   - **NODE_ENV** com valor **production**

6. Marque os ambientes em que a aplicação será utilizada (Production e, se necessário, Preview).
7. Salve as variáveis e faça um novo deploy ou redeploy.

O arquivo **vercel.json** já declara o framework Express e a aplicação exporta sua instância pelo arquivo **index.js**. Não é necessário colocar as chaves em arquivos públicos ou no código-fonte.

Depois do deploy, verifique a aplicação e o endpoint:

~~~text
https://SEU-DOMINIO.vercel.app/
https://SEU-DOMINIO.vercel.app/api/health
~~~

O endpoint de saúde deve responder com um JSON semelhante a:

~~~json
{
  "ok": true,
  "service": "cinenov"
}
~~~

### Problemas comuns no deploy

| Sintoma | O que verificar |
|---|---|
| Erro ao conectar ao Supabase | Confira se **SUPABASE_URL** pertence ao mesmo projeto da chave secreta. |
| Erro RLS / código **42501** | Confirme que o servidor está usando a chave secreta correta e que o script SQL foi executado. Não desative RLS como correção. |
| Erro de autenticação do TMDB / status **401** | Confira se **TMDB_API_KEY** contém a Chave de API v3 correta, sem Bearer ou aspas. |
| Filmes não carregam | Confira a variável **TMDB_API_KEY** no ambiente do deploy e consulte os logs da Vercel. |
| Variáveis atualizadas, mas o erro continua | Faça um novo deploy para aplicar as variáveis ao novo deployment. |
| Aplicação não abre na raiz | Confira se o Root Directory da Vercel está como **cinenov-app** e se o deploy terminou com sucesso. |

## 📌 Observações

- Os dados de filmes são fornecidos pelo TMDB e dependem da disponibilidade da API.
- O catálogo é apresentado em português do Brasil (pt-BR) e considera a região brasileira (BR).
- O cache de filmes é temporário e mantido em memória pelo servidor.
- Favoritos são salvos localmente no navegador. Limpar os dados do navegador pode apagar essa lista.
- O projeto utiliza o TMDB para dados e imagens de filmes; não é afiliado nem endossado pelo TMDB.

## 👨‍💻 Autor

Desenvolvido por **Murilo Silva Magalhães**.

- GitHub: [@mur1lxz](https://github.com/mur1lxz)
- LinkedIn: [linkedin.com/in/murilosilvaa](https://linkedin.com/in/murilosilvaa)

---

<p align="center">
  Feito para explorar desenvolvimento web, integração de APIs, autenticação e persistência de dados.
</p>
