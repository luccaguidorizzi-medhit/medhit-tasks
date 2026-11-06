# Model Context Protocol (MCP) — Servidor MedHit WorkTrack

> **Mantido por:** Equipe MedHit I&A  
> **Protocolo:** Model Context Protocol (MCP) — Versão 2024-11-05  
> **Endpoint Oficial:** `https://work.medhit.click/api/mcp`  
> **Transporte:** Streamable JSON-RPC 2.0 sobre HTTP POST  
> **Autenticação:** `Authorization: Bearer <MCP_TOKEN>`

---

## 1. Visão Geral da Arquitetura

O **MedHit WorkTrack** dispõe de um servidor MCP nativo e enterprise-grade, desenhado para que agentes autônomos de Inteligência Artificial (Google Antigravity, Cursor IDE, Claude Desktop, fluxos no n8n e microsserviços internos) operem demandas, quadros e governança corporativa com o mesmo rigor de isolamento e rastreabilidade dos usuários humanos.

### Princípios de Segurança e Governança

1. **Zero Credential Leakage:** Senhas de usuários e tokens MCP de outros colaboradores **nunca** são expostos em payloads, listagens, logs ou schemas.
2. **Tokens Criptográficos Individuais:** Cada colaborador e agente possui seu próprio token assinado (`mh_live_...` para credenciais mestras ativas e `mh_sec_...` para tokens de membros).
3. **Auditoria e Contexto de Execução:** Toda ação executada via MCP vincula-se ao `activeUser` autenticado pelo Bearer token, garantindo atribuição fidedigna de autoria e integridade no log do sistema.
4. **Assinatura Corporativa Obrigatória:** Todas as operações reportam autoria exclusiva da **Equipe MedHit I&A**.

---

## 2. Como Conectar seus Agentes

### A. Google Antigravity (`~/.gemini/config/mcp_config.json`)

```json
{
  "mcpServers": {
    "medhit-tasks": {
      "type": "http",
      "url": "https://work.medhit.click/api/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN_MCP_MEDHIT"
      }
    }
  }
}
```

### B. Cursor IDE (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "medhit-tasks": {
      "url": "https://work.medhit.click/api/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN_MCP_MEDHIT"
      }
    }
  }
}
```

### C. Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "medhit-tasks": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "--url",
        "https://work.medhit.click/api/mcp",
        "--header",
        "Authorization: Bearer SEU_TOKEN_MCP_MEDHIT"
      ]
    }
  }
}
```

### D. Chamada Direta via cURL (HTTP JSON-RPC 2.0)

```bash
curl -X POST https://work.medhit.click/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_MCP_MEDHIT" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-1",
    "method": "tools/call",
    "params": {
      "name": "list_tasks",
      "arguments": {
        "priority": "urgent"
      }
    }
  }'
```

---

## 3. Catálogo Completo das 24 Ferramentas (MCP Tools)

### Grupo 1: Áreas & Squads (3 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `list_areas` | *Nenhum* | Lista todas as áreas de negócio/squads do workspace com seus projetos e estatísticas. |
| `create_area` | `name` (string, req), `description` (string), `color` (string), `icon` (string) | Cria uma nova squad de trabalho no workspace corporativo. |
| `delete_area` | `areaId` (string, req) | Remove uma área e desvincula seus projetos dependentes. |

### Grupo 2: Quadros & Projetos (4 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `list_projects` | `areaId` (string, opcional) | Lista quadros/projetos de uma área específica ou de todo o ecossistema MedHit. |
| `get_project` | `projectId` (string, req) | Retorna a estrutura detalhada de um projeto, colunas kanban, sprints e metas. |
| `create_project` | `name` (string, req), `areaId` (string, req), `description` (string), `color` (string) | Instancia um novo projeto Kanban em uma squad determinada. |
| `delete_project` | `projectId` (string, req) | Exclui o quadro especificado e todas as tarefas vinculadas a ele. |

### Grupo 3: Tarefas & Demandas — CRUD Completo (6 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `list_tasks` | `projectId` (string), `statusId` (string), `priority` (string), `search` (string) | Consulta tarefas com filtragem avançada por projeto, coluna, urgência ou texto. |
| `get_task` | `taskId` (string, req) | Retorna todos os dados da tarefa: checklists, histórico, anexos e comentários. |
| `create_task` | `title` (string, req), `projectId` (string, req), `statusId` (string, req), `priority` (string), `description` (string), `assigneeId` (string), `dueDate` (string), `tags` (array) | Cria uma nova demanda no quadro indicado. |
| `update_task` | `taskId` (string, req), campos para atualizar (`title`, `description`, `priority`, `dueDate`, `assigneeId`, etc.) | Atualiza metadados ou conteúdo de uma demanda existente. |
| `move_task` | `taskId` (string, req), `targetStatusId` (string, req), `position` (number, opcional) | Move a tarefa entre colunas do kanban (ex: de Backlog para Em Progresso ou Concluído). |
| `delete_task` | `taskId` (string, req) | Exclui permanentemente a tarefa especificada. |

### Grupo 4: Colaboração & Checklists (2 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `add_comment` | `taskId` (string, req), `content` (string, req) | Adiciona um comentário oficial à tarefa assinado pelo usuário/agente ativo. |
| `toggle_checklist_item` | `taskId` (string, req), `checklistId` (string, req), `itemId` (string, req) | Alterna o estado de conclusão (checked/unchecked) de um item de checklist. |

### Grupo 5: Governança de Membros & Acessos (4 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `list_members` | *Nenhum* | Lista membros ativos e funções no workspace. **Higienizado:** nunca expõe senhas ou tokens alheios. |
| `get_current_user` | *Nenhum* | Retorna os dados do usuário autenticado no token ativo e a assinatura institucional `Equipe MedHit I&A`. |
| `update_member_role` | `memberId` (string, req), `role` (`"owner" \| "admin" \| "member" \| "guest"`, req) | Altera o nível hierárquico e permissões RBAC de um colaborador. |
| `invite_member` | `name` (string, req), `email` (string, req), `role` (string, req), `sendEmail` (boolean, opcional) | Cria convite para novo colaborador, gera token MCP seguro e dispara convite transacional com link de ativação de senha. |

### Grupo 6: Orquestração de Agentes Autônomos de IA (5 Ferramentas)

| Ferramenta | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `list_agents` | *Nenhum* | Lista todos os agentes de IA cadastrados no sistema (Dev, Copy, Tráfego, Automações). |
| `claim_next_task` | `agentId` (string, req) | O agente reivindica a próxima tarefa pendente em sua fila de execução. |
| `report_progress` | `runId` (string, req), `eventType` (`"thought" \| "tool_call" \| "tool_result" \| "message" \| "error"`, req), `content` (string, req) | Registra raciocínio ou evento de execução do agente no histórico da demanda. |
| `request_approval` | `taskId` (string, req), `agentId` (string, req), `requestedAction` (string, req), `payload` (object, opcional) | Pausa a execução do agente e solicita aprovação de um gestor humano para ações de risco. |
| `complete_task` | `runId` (string, req) | Finaliza a execução do agente e move a demanda para o status concluído. |

---

## 4. Estrutura de Respostas e Tratamento de Erros

O servidor obedece estritamente às especificações JSON-RPC 2.0:

### Exemplo de Resposta com Sucesso
```json
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"id\": \"task-123\",\n  \"title\": \"Configurar Webhook WhatsApp\",\n  \"statusId\": \"in_progress\"\n}"
      }
    ]
  }
}
```

### Exemplo de Resposta de Erro
```json
{
  "jsonrpc": "2.0",
  "id": "req-1",
  "error": {
    "code": -32602,
    "message": "Tarefa não encontrada para o ID informado"
  }
}
```

---

## 5. Auditoria e Rastreabilidade

Todas as invocações feitas via MCP alimentam a central de auditoria (`src/server/services/data-store.ts`), registrando:
- Identificador do usuário / agente autor da ação
- Método e ferramenta invocada
- Timestamp no padrão ISO 8601
- Sucesso ou falha da operação

---
*Documentação oficial mantida pela **Equipe MedHit I&A**.*
