# LAN API

API REST do LAN, sistema de gestão para barbearias e salões. O backend concentra autenticação, clientes, profissionais, serviços, atendimentos, pagamentos, crédito de clientes, fluxo de caixa, dashboard e análise de fidelidade.

## Tecnologias

- Node.js e TypeScript
- Express 5
- PostgreSQL
- Prisma ORM 6
- Zod
- JWT em cookies HttpOnly
- bcryptjs

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL acessível localmente ou por um serviço como Neon

## Configuração local

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir de `.env.example` e preencha os valores:

```env
PORT=3333
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public
JWT_ACCESS_SECRET=use_um_segredo_longo_e_aleatorio
JWT_REFRESH_SECRET=use_outro_segredo_longo_e_aleatorio
NODE_ENV=development
```

Nunca envie o arquivo `.env` ao Git. Os segredos de acesso e renovação devem ser diferentes.

Aplique as migrations existentes e inicie o servidor:

```bash
npm run db:deploy
npm run dev
```

A API ficará disponível em `http://localhost:3333`. Verifique com `GET /health`.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Executa a API em desenvolvimento com watch |
| `npm run build` | Gera o Prisma Client e compila o TypeScript |
| `npm run start` | Executa o código compilado em `dist` |
| `npm run db:deploy` | Aplica migrations pendentes no banco configurado |

## Recursos da API

| Prefixo | Recurso |
| --- | --- |
| `/sessions` | Login, renovação e encerramento de sessão |
| `/users` | Cadastro e dados do usuário |
| `/customers` | Clientes, indicadores e ranking de fidelidade |
| `/professionals` | Profissionais e vínculos com serviços |
| `/services` | Catálogo de serviços e preços |
| `/appointments` | Atendimentos, filtros e histórico |
| `/dashboard` | Indicadores financeiros e operacionais |
| `/finance` | Receitas, despesas, pagamentos, crédito e estornos |

As rotas de dados exigem uma sessão autenticada. A API valida a entrada e restringe as consultas ao usuário autenticado.

## Autenticação e segurança

O login grava dois cookies no host da API:

- acesso com duração de 15 minutos;
- renovação com duração de até 7 dias quando “Lembrar de mim” está marcado.

Em produção, os cookies usam `HttpOnly`, `Secure`, `SameSite=Lax`, prefixo `__Host-` e não definem `Domain`. Tokens não são devolvidos no JSON nem armazenados pelo front em `localStorage`.

Requisições que alteram dados precisam vir da origem autorizada e enviar `X-CSRF-Protection: 1`. As origens atuais são:

- desenvolvimento: `http://localhost:3000`;
- produção: `https://app.jdbarbeariatapuio.com.br`.

A aplicação também utiliza Helmet, limite geral de requisições, mensagens públicas genéricas para erros internos e isolamento dos dados por conta.

## Banco e migrations

O schema está em `prisma/schema.prisma` e o histórico em `prisma/migrations`. Em produção, utilize `npm run db:deploy`; não use `prisma db push` como substituto das migrations versionadas.

Com Neon, prefira a URL com pool de conexões. O cliente adiciona `connect_timeout=15` e `pool_timeout=15` quando esses parâmetros não estiverem definidos na URL.

## Deploy no Render

Configuração recomendada:

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check: `/health`

Configure `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` e `NODE_ENV=production`. A variável `PORT` é fornecida pelo Render. Após adicionar uma migration, execute `npm run db:deploy` contra o banco de produção.

O ambiente publicado utiliza `https://api.jdbarbeariatapuio.com.br`, enquanto o front utiliza `https://app.jdbarbeariatapuio.com.br`.

## Licença

Projeto privado. Todos os direitos reservados.
