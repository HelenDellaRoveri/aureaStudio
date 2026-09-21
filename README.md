# Áurea Studio

Sistema full stack de agendamento para salão de beleza, com interface do cliente, acesso de profissionais e painel administrativo.

## Configuração no Windows

### 1. Instale as dependências

Abra o Prompt de Comando ou PowerShell dentro da pasta do projeto:

```bash
npm install
```

Use `npm run ...` para executar scripts. Não use `npm install:ci` nem `npm i install:ci`.

### 2. Crie o banco no Neon

1. Crie um projeto em https://neon.com.
2. No painel do projeto, copie a **connection string** do PostgreSQL.
3. Crie o arquivo `.env` a partir do exemplo:

No Prompt de Comando:

```bat
copy .env.example .env
```

Abra o `.env` e informe sua conexão:

```env
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require
JWT_SECRET=coloque-aqui-uma-chave-secreta-longa-com-mais-de-32-caracteres
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Nunca envie o arquivo `.env` para o GitHub.

### 3. Prepare o banco e as contas de teste

```bash
npm run db:setup
npm run db:seed
```

### 4. Inicie frontend e backend

```bash
npm run dev
```

Abra `http://localhost:5173`. O frontend encaminha `/api` para o backend em `http://localhost:3001`.

## Acessos demonstrativos

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Salão / administradora | `admin@aureastudio.com.br` | `Aurea@2026` |
| Cabeleireira | `ana@aureastudio.com.br` | `Profissional@2026` |
| Cliente | `cliente@aureastudio.com.br` | `Cliente@2026` |

Altere ou remova essas credenciais antes de colocar o sistema em produção. Novos cadastros feitos pela interface são sempre do tipo cliente.

## Recursos implementados

- Navegação pública: Início, Serviços, Profissionais e Agendar.
- “Meus horários” e perfil protegidos por login.
- Login separado por Cliente, Cabeleireira e Salão.
- Cadastro exclusivo para clientes.
- Sessão em cookie HTTP-only e senhas protegidas com bcrypt.
- Agendamentos e cancelamentos persistidos no Neon PostgreSQL.
- Verificação de conflito de horários no backend.
- Painel completo para o salão e painel reduzido para a profissional.
- Cadastro de profissionais com criação automática do acesso de cabeleireira.
- Agenda navegável por semana, com retorno rápido para a semana atual.
- Bloqueios de dia inteiro ou por intervalo, para todo o salão ou por profissional.
- Layout responsivo para computador e celular.

## Atualização do banco

Depois de substituir uma versão anterior do projeto por esta, execute novamente:

```bash
npm run db:setup
npm run db:seed
```

O primeiro comando cria as novas tabelas sem apagar usuários ou agendamentos existentes. O segundo cadastra ou atualiza apenas os dados demonstrativos.

## Comandos úteis

```bash
npm run dev             # frontend e backend juntos
npm run dev:frontend    # somente Vite
npm run dev:backend     # somente API
npm run build           # build de produção
npm start               # serve API e dist em produção
npm run db:setup        # cria tabelas e índices
npm run db:seed         # cria/atualiza contas demonstrativas
```

Os nomes, preços, avaliações e demais dados de catálogo são demonstrativos e podem ser editados em `lib/data.ts`.
