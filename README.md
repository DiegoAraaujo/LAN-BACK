# LAN API

API do LAN, responsável por autenticação e pela gestão de clientes, profissionais, serviços, atendimentos, pagamentos, crédito, fluxo de caixa e indicadores.

## Stack

- Node.js, Express 5 e TypeScript
- PostgreSQL e Prisma ORM
- Zod, JWT e bcryptjs

## Rodando localmente

Requisitos: Node.js 20+, npm e PostgreSQL.

```bash
git clone https://github.com/DiegoAraaujo/LAN-BACK.git
cd LAN-BACK
npm install
```

Copie `.env.example` para `.env` e configure as variáveis:

```env
PORT=3333
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco?schema=public
JWT_ACCESS_SECRET=use_um_segredo_longo
JWT_REFRESH_SECRET=use_outro_segredo_longo
NODE_ENV=development
```

Aplique as migrations e inicie a API:

```bash
npm run db:deploy
npm run dev
```

A API ficará disponível em `http://localhost:3333`.
