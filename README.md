# MedHit Task Manager (Plataforma de Gestão de Trabalho & Agentes de IA)

> Desenvolvido e Mantido por: **MedHit Integrações & Automações**  
> Ecossistema: **MedHit**

---

## 🌟 Visão Geral

O **MedHit Task Manager** é uma plataforma full-stack moderna de gestão ágil de trabalho e projetos que integra humanos e agentes autônomos de IA no mesmo fluxo de trabalho, com facilidade do Trello, flexibilidade do ClickUp, visão em tabela do Monday, rigor ágil do Jira e um servidor **Model Context Protocol (MCP)** embutido.

### 🛡️ Isolamento no Banco de Dados Supabase
Todas as 33 tabelas e tipos utilizam o prefixo **`medtask_*`** para garantir coexistência pacífica e isolamento absoluto de dados com as tabelas de CRM e mídias existentes no projeto `medhit-intelligence`.

---

## 🚀 Funcionalidades Principais

1. **Visões de Trabalho Alternáveis:**
   - **Quadro Kanban:** Drag & Drop fluido (`dnd-kit`), limite WIP por coluna, avatares humanos e selos visuais para agentes de IA.
   - **Visão em Lista:** Expansível, agrupada por status com metadados e atalhos rápidos.
   - **Tabela Monday:** Estilo planilha com resumo no rodapé (soma de story points, % de conclusão).
   - **Calendário:** Visão mensal com distribuição de prazos.
   - **Metodologia Ágil:** Gestão de Sprints ativas, Gráfico Burndown interativo (`recharts`) e Retrospectiva com colunas de melhoria contínua.
2. **Gaveta Deslizante de Tarefas:**
   - Edição inline de títulos, descrições e status.
   - Campo exclusivo **Contexto para IA** para orientar agentes autônomos.
   - Checklists / Critérios de aceite interativos.
   - Comentários e histórico de atividades com @menções.
3. **Agentes de IA de Primeira Classe:**
   - Catálogo de agentes especialistas (`MedCopy IA`, `n8n Auditor IA`, `Triage Bot IA`).
   - Ciclo de vida: fila, claim atômico com lease e heartbeat, log de eventos passo a passo.
   - **Central de Aprovações (Human-in-the-Loop):** Controle rígido de ações de alto impacto com aprovação/rejeição e justificativa.
4. **Servidor MCP Embutido (`/api/mcp`):**
   - Streamable HTTP compatível com Claude Desktop, Cursor, Antigravity e n8n.
   - Leitura, criação de tarefas, claim e solicitações de aprovação.
5. **Motor de Automações Visuais:**
   - Regras configuráveis no padrão *"Quando → Se → Então"*.
6. **Formulário Público de Solicitações (`/f/[formId]`):**
   - Intake limpo para solicitações externas com triagem automática por IA.

---

## 🛠️ Como Executar Localmente

### 1. Pré-requisitos
- Node.js 20+
- pnpm instalado globalmente

### 2. Instalação e Execução
```bash
# Entrar no diretório
cd C:\Users\Lucca\.gemini\antigravity\scratch\medhit-tasks

# Instalar dependências (caso necessário)
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev
```

Acesse em seu navegador:  
`http://localhost:3000`

---

## 🧭 Rotas Principais

- **Quadro Kanban:** `http://localhost:3000/medhit/marketing/workshop-medicina-integrativa/board`
- **Visão em Lista:** `http://localhost:3000/medhit/marketing/workshop-medicina-integrativa/list`
- **Tabela Monday:** `http://localhost:3000/medhit/marketing/workshop-medicina-integrativa/table`
- **Calendário:** `http://localhost:3000/medhit/marketing/workshop-medicina-integrativa/calendar`
- **Agile / Sprints & Burndown:** `http://localhost:3000/medhit/marketing/workshop-medicina-integrativa/agile`
- **Painel de Agentes de IA:** `http://localhost:3000/medhit/agents`
- **Central de Aprovações Humanas:** `http://localhost:3000/medhit/approvals`
- **Automações:** `http://localhost:3000/medhit/automations`
- **Configurações MCP:** `http://localhost:3000/medhit/settings/mcp`
- **Formulário Público:** `http://localhost:3000/f/marketing-request`
- **Endpoint MCP:** `POST /api/mcp`
