# Áurea Studio

Sistema full stack de agendamento para salão de beleza, com interface do cliente, acesso de profissionais e painel administrativo. O frontend usa React + Vite; o backend usa Express; usuários, serviços, profissionais, horários e agendamentos ficam no Neon PostgreSQL.

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

No PowerShell:

```powershell
Copy-Item .env.example .env
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

### 3. Prepare o banco e as contas iniciais

```bash
npm run db:setup
npm run db:seed
npm run db:seed-dados

```

### 4. Inicie frontend e backend

```bash
npm run dev
```

Abra `http://localhost:5173`. O frontend encaminha `/api` para o backend em `http://localhost:3001`.

## Acessos iniciais

| Perfil                 | E-mail                       | Senha               |
| ---------------------- | ---------------------------- | ------------------- |
| Salão / administradora | `admin@aureastudio.com.br`   | `Aurea@2026`        |
| Cabeleireira           | `ana@aureastudio.com.br`     | `Profissional@2026` |
| Cliente                | `cliente@aureastudio.com.br` | `Cliente@2026`      |

Altere ou remova essas credenciais antes de colocar o sistema em produção. Novos cadastros feitos pela interface são sempre do tipo cliente.

## Recursos implementados

- Navegação pública: Início, Serviços, Profissionais e Agendar.
- “Meus horários” e perfil protegidos por login.
- Login separado por Cliente, Cabeleireira e Salão.
- Cadastro exclusivo para clientes.
- Sessão em cookie HTTP-only e senhas protegidas com bcrypt.
- Agendamentos e cancelamentos persistidos no Neon PostgreSQL.
- Reagendamento atualiza o mesmo registro, sem duplicar o horário.
- Verificação de conflito de horários no backend.
- Datas de agendamento e bloqueio limitadas entre hoje e 31 de dezembro do ano atual, com validação no navegador e no backend.
- Painel completo para o salão e painel reduzido para a profissional.
- Cadastro de profissionais com criação automática do acesso de cabeleireira.
- Cadastro, listagem e ativação de serviços persistidos no Neon PostgreSQL.
- Previsão financeira separada por acesso: o salão visualiza somente sua parcela de 40% e cada profissional visualiza somente os 60% dos próprios atendimentos.
- Edição do perfil profissional, incluindo especialidade, descrição, expediente, dias, serviços e situação ativa/inativa.
- Agenda navegável por semana, com retorno rápido para a semana atual.
- Bloqueios de dia inteiro ou por intervalo, para todo o salão ou por profissional.
- Dias e horários de funcionamento persistidos no Neon e respeitados no agendamento.
- Catálogo, equipe, clientes e agenda iniciam vazios; somente os três acessos acima são criados.
- Layout responsivo para computador e celular.

## Atualização do banco

Depois de substituir uma versão anterior do projeto por esta, execute novamente:

```bash
npm run db:setup
npm run db:seed
```

O primeiro comando cria as novas tabelas sem apagar usuários ou agendamentos existentes. O segundo remove apenas os antigos perfis demonstrativos e cadastra ou atualiza os três acessos iniciais.

## Comandos úteis

```bash
npm run dev             # frontend e backend juntos
npm run dev:frontend    # somente Vite
npm run dev:backend     # somente API
npm run build           # build de produção
npm start               # serve API e dist em produção
npm run db:setup        # cria tabelas e índices
npm run db:seed         # limpa demos antigos e cria/atualiza os 3 acessos
npm run db:seed-dados   # cria dados fictícios

```

Depois do primeiro acesso como salão, cadastre profissionais e serviços e ative os dias de funcionamento em **Configurações**.
