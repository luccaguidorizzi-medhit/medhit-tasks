# MedHit Task Manager - Agent Conventions & Guidelines

> Autor e Mantenedor: **Lagana Flow**  
> Aplicação: **MedHit Task Manager (Plataforma de Gestão de Trabalho & Agentes de IA)**  
> Ecossistema: MedHit (Instância independente com isolamento estrito de dados)

---

## 1. Visão Geral e Arquitetura

O **MedHit Task Manager** é uma plataforma full-stack moderna de gestão ágil de trabalho e projetos que integra humanos e agentes autônomos de IA no mesmo fluxo de trabalho.

- **Frontend / Fullstack:** Next.js 15 (App Router, React 19, Server Components + Server Actions), TypeScript estrito.
- **Estilos:** Tailwind CSS v4 + shadcn/ui + Radix UI + Lucide React, suporte a tema claro/escuro via `next-themes`.
- **Banco de Dados & Storage:** Supabase (PostgreSQL, Auth, Realtime, Storage) com RLS ativado em todas as tabelas.
- **ORM & Migrações:** Drizzle ORM + drizzle-kit (localizadas em `/drizzle`).
- **Isolamento de Banco:** Todas as tabelas do projeto utilizam o prefixo obrigatório `medtask_` para coexistir com segurança total e zero conflito no banco do MedHit.
- **Protocolo MCP:** Servidor Model Context Protocol embutido na rota `/api/mcp` com transporte Streamable HTTP e autenticação via Bearer token (API Key escopada).
- **IA:** Vercel AI SDK (compatível com múltiplos provedores: Gemini, OpenAI, Claude).
- **Jobs Agendados:** Vercel Cron via `/api/cron/*` protegido por `CRON_SECRET`.
- **Testes:** Vitest (regras de negócio e serviços) + Playwright (fluxos ponta a ponta).

---

## 2. Regras de Ouro de Desenvolvimento

1. **Assinatura e Autoria:**  
   Todo código, commit, documentação, metadados e logs do projeto devem ser atribuídos e assinados estritamente como **Lagana Flow**.
2. **Camadas de Software (Separação Rígida):**  
   - Regras de negócio vivem exclusivamente em `src/server/services`.
   - Rotas de API (`/api/*`), Server Actions e Tools MCP são cascas finas (thin controllers) que invocam os services e validam entradas com Zod.
   - Componentes visuais (`src/components/*`) não acessam o banco diretamente; utilizam hooks, Server Actions ou TanStack Query.
3. **Idiomas:**  
   - Código, variáveis, commits, tabelas e documentação técnica em **inglês**.
   - Toda a interface do usuário (labels, textos, mensagens, toasts) em **Português do Brasil (pt-BR)**.
4. **Sem Placeholders:**  
   Código de produção: proibido `TODO`, botões sem ação, dados fictícios hardcoded ou telas "em breve".
5. **Human-in-the-loop & IA:**  
   Agentes de IA são membros com selo visual, limites de tokens, leases atômicos (`claim_next_task`) e aprovações humanas obrigatórias (`approvals`) para ações de impacto.

---

## 3. Comandos Úteis

- Instalação: `pnpm install`
- Desenvolvimento local: `pnpm dev`
- Validação de tipos: `pnpm typecheck`
- Linter: `pnpm lint`
- Build de produção: `pnpm build`
- Testes unitários: `pnpm test`
- Drizzle Migrations: `pnpm db:generate` e `pnpm db:push` / `pnpm db:migrate`
- Seed do banco: `pnpm db:seed`
